import base64
import json
import logging
import re
from typing import TypeVar

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

MAX_RETRIES = 2
RETRY_SUFFIX = (
    "Your previous response was invalid JSON / missing required fields. "
    "Return ONLY the JSON object."
)

# Free-tier request quota is metered per day PER MODEL; gemini-3.6-flash
# allows only 20, and one report costs several calls. flash-lite is roomier
# and still does text, vision and audio.
DEFAULT_MODEL = "gemini-3.5-flash-lite"


class GeminiError(Exception):
    """Raised when Gemini calls fail after retries."""


class GeminiClient:
    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model

    def generate_json(
        self,
        system_prompt: str,
        images: list[str | bytes],
        extra_text: str,
        output_model: type[T],
    ) -> T:
        last_error: Exception | None = None
        prompt = system_prompt

        for attempt in range(MAX_RETRIES + 1):
            try:
                raw_text = self._call_gemini(prompt, images, extra_text, output_model)
                parsed = self._parse_json(raw_text)
                return output_model.model_validate(parsed)
            except (json.JSONDecodeError, ValidationError, ValueError) as exc:
                last_error = exc
                logger.warning(
                    "Gemini JSON validation failed (attempt %d/%d): %s",
                    attempt + 1,
                    MAX_RETRIES + 1,
                    exc,
                )
                if attempt < MAX_RETRIES:
                    prompt = f"{system_prompt}\n\n{RETRY_SUFFIX}"

        raise GeminiError(
            f"Gemini returned invalid JSON after {MAX_RETRIES + 1} attempts: {last_error}"
        ) from last_error

    def _call_gemini(
        self,
        system_prompt: str,
        images: list[str | bytes],
        extra_text: str,
        output_model: type[T],
    ) -> str:
        parts: list[types.Part] = []
        if extra_text.strip():
            parts.append(types.Part.from_text(text=extra_text))
        for image in images:
            parts.append(self._prepare_image_part(image))

        if not parts:
            parts.append(types.Part.from_text(text="Respond with the requested JSON."))

        # Gemini takes the system prompt out of band rather than as a message role,
        # and can be pinned to the output schema instead of only to "some JSON".
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=output_model,
        )

        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=[types.Content(role="user", parts=parts)],
                config=config,
            )
        except genai_errors.ClientError as exc:
            # 400/401/403 all arrive as ClientError; a bad key is the one worth naming.
            if getattr(exc, "code", None) in (401, 403):
                raise GeminiError(
                    "Gemini authentication failed. Check GEMINI_API_KEY in backend/.env"
                ) from exc
            raise GeminiError(f"Gemini API error: {exc}") from exc
        except genai_errors.APIError as exc:
            raise GeminiError(f"Gemini API error: {exc}") from exc

        raw_text = response.text
        if not raw_text:
            raise GeminiError("Gemini returned an empty response")
        return raw_text

    def _prepare_image_part(self, image: str | bytes) -> types.Part:
        if isinstance(image, bytes):
            data, mime_type = image, "image/jpeg"
        elif image.startswith("data:"):
            data, mime_type = self._decode_data_url(image)
        else:
            data, mime_type = self._fetch_image(image)
        return types.Part.from_bytes(data=data, mime_type=mime_type)

    @staticmethod
    def _decode_data_url(url: str) -> tuple[bytes, str]:
        header, _, payload = url.partition(",")
        if not payload:
            raise ValueError("Malformed data URL image")
        mime_type = header[5:].split(";")[0] or "image/jpeg"
        return base64.b64decode(payload), mime_type

    def _fetch_image(self, url: str) -> tuple[bytes, str]:
        headers = {"User-Agent": "CivicIssueRoutingAgent/1.0"}
        with httpx.Client(timeout=30.0, headers=headers) as client:
            response = client.get(url)
            response.raise_for_status()
            mime_type = response.headers.get("content-type", "image/jpeg").split(";")[0]
            if mime_type not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
                mime_type = "image/jpeg"
            return response.content, mime_type

    @staticmethod
    def _parse_json(raw_text: str) -> dict:
        cleaned = strip_markdown_fences(raw_text)
        if not cleaned.startswith("{"):
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                cleaned = match.group(0)
            else:
                raise ValueError("Response contains no JSON object")
        return json.loads(cleaned)


def strip_markdown_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


_default_client: GeminiClient | None = None


def get_gemini_client() -> GeminiClient:
    global _default_client
    if _default_client is None:
        import os

        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise GeminiError("GEMINI_API_KEY environment variable is not set")
        model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
        _default_client = GeminiClient(api_key=api_key, model=model)
    return _default_client


def set_gemini_client(client: GeminiClient | None) -> None:
    global _default_client
    _default_client = client
