"""Voice-note transcription via Gemini. Used by the ingest node.

Gemini has no separate speech-to-text endpoint: the same multimodal model that
classifies the photo also reads the audio, so the note is sent inline as bytes
alongside a transcription instruction.
"""

import logging

import httpx
from google import genai
from google.genai import types

from app.config import settings

log = logging.getLogger(__name__)

# MediaRecorder gives webm on Chrome and mp4/m4a on iOS Safari, so the container
# has to be declared rather than assumed.
_MIME_BY_EXT = {
    "mp3": "audio/mp3",
    "mpeg": "audio/mpeg",
    "mpga": "audio/mpeg",
    "m4a": "audio/mp4",
    "mp4": "audio/mp4",
    "wav": "audio/wav",
    "webm": "audio/webm",
    "ogg": "audio/ogg",
    "aac": "audio/aac",
    "flac": "audio/flac",
}

_PROMPT = (
    "Transcribe this voice note verbatim. The speaker is a Karachi resident and may "
    "use Urdu, Roman Urdu, English or a mix. Write Urdu speech in Roman Urdu. "
    "Output the transcript only, with no preamble, quotes or commentary. "
    "If there is no intelligible speech, output nothing at all."
)


async def transcribe_from_url(media_url: str) -> str:
    """Download a voice note from Supabase Storage and transcribe it.

    Returns "" on any failure — a failed transcription must degrade the report,
    never break the pipeline.
    """
    if settings.mock_agents:
        return "[mock transcript] Yahan sadak par bohot bara gaddha hai, pani bhi jama hai."

    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.get(media_url)
            resp.raise_for_status()
            audio = resp.content

        ext = media_url.rsplit(".", 1)[-1].lower()
        mime = _MIME_BY_EXT.get(ext, "audio/webm")

        client = genai.Client(api_key=settings.gemini_api_key)
        result = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=[
                types.Part.from_bytes(data=audio, mime_type=mime),
                _PROMPT,
            ],
        )
        return (result.text or "").strip()
    except Exception:
        log.warning("transcription failed for %s", media_url, exc_info=True)
        return ""
