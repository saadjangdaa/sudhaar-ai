import base64
import json
import logging
import re
from typing import TypeVar

import httpx
from openai import APIError, AuthenticationError, OpenAI
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

MAX_RETRIES = 2
RETRY_SUFFIX = (
    "Your previous response was invalid JSON / missing required fields. "
    "Return ONLY the JSON object."
)


class OpenAIError(Exception):
    """Raised when OpenAI calls fail after retries."""


class OpenAIClient:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        self._client = OpenAI(api_key=api_key)
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
                raw_text = self._call_openai(prompt, images, extra_text)
                parsed = self._parse_json(raw_text)
                return output_model.model_validate(parsed)
            except (json.JSONDecodeError, ValidationError, ValueError) as exc:
                last_error = exc
                logger.warning(
                    "OpenAI JSON validation failed (attempt %d/%d): %s",
                    attempt + 1,
                    MAX_RETRIES + 1,
                    exc,
                )
                if attempt < MAX_RETRIES:
                    prompt = f"{system_prompt}\n\n{RETRY_SUFFIX}"

        raise OpenAIError(
            f"OpenAI returned invalid JSON after {MAX_RETRIES + 1} attempts: {last_error}"
        ) from last_error

    def _call_openai(
        self, system_prompt: str, images: list[str | bytes], extra_text: str
    ) -> str:
        user_content: list[dict] = []
        if extra_text.strip():
            user_content.append({"type": "text", "text": extra_text})
        for image in images:
            user_content.append(self._prepare_image_part(image))

        if not user_content:
            user_content.append({"type": "text", "text": "Respond with the requested JSON."})

        try:
            response = self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
            )
        except AuthenticationError as exc:
            raise OpenAIError(
                "OpenAI authentication failed. Check OPENAI_API_KEY in backend/.env"
            ) from exc
        except APIError as exc:
            raise OpenAIError(f"OpenAI API error: {exc}") from exc

        raw_text = response.choices[0].message.content
        if not raw_text:
            raise OpenAIError("OpenAI returned an empty response")
        return raw_text

    def _prepare_image_part(self, image: str | bytes) -> dict:
        if isinstance(image, bytes):
            data = image
            mime_type = "image/jpeg"
        elif image.startswith("data:"):
            return {"type": "image_url", "image_url": {"url": image}}
        else:
            data, mime_type = self._fetch_image(image)
        encoded = base64.b64encode(data).decode("ascii")
        url = f"data:{mime_type};base64,{encoded}"
        return {"type": "image_url", "image_url": {"url": url}}

    def _fetch_image(self, url: str) -> tuple[bytes, str]:
        with httpx.Client(timeout=30.0) as client:
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


_default_client: OpenAIClient | None = None


def get_openai_client() -> OpenAIClient:
    global _default_client
    if _default_client is None:
        import os

        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise OpenAIError("OPENAI_API_KEY environment variable is not set")
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        _default_client = OpenAIClient(api_key=api_key, model=model)
    return _default_client


def set_openai_client(client: OpenAIClient | None) -> None:
    global _default_client
    _default_client = client
