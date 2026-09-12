"""Voice-note transcription via OpenAI. Used by the ingest node."""

import logging

import httpx
from openai import AsyncOpenAI

from app.config import settings

log = logging.getLogger(__name__)


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

        # The extension matters to the API; MediaRecorder gives webm on Chrome and
        # mp4/m4a on iOS Safari, so trust the URL rather than assuming.
        ext = media_url.rsplit(".", 1)[-1].lower()
        if ext not in {"mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg"}:
            ext = "webm"

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        result = await client.audio.transcriptions.create(
            model=settings.openai_transcribe_model,
            file=(f"note.{ext}", audio),
        )
        return (result.text or "").strip()
    except Exception:
        log.warning("transcription failed for %s", media_url, exc_info=True)
        return ""
