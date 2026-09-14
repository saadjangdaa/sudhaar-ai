"""Single place where a Gemini client is constructed. Gemini only — no other providers."""

from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings

_cache: dict[str, ChatGoogleGenerativeAI] = {}


def get_llm(temperature: float = 0.2, model: str | None = None) -> ChatGoogleGenerativeAI:
    """Return a cached chat model.

    NOTE ON temperature: the current flash models use fixed sampling defaults and
    ignore this value (langchain-google-genai emits a UserWarning saying so). The
    parameter is kept because callers express intent with it — 0.0 for the
    classifier/router/validator, 0.4 for the drafter — and because a future model
    that honours it should pick the value up with no call-site change. It stays in
    the cache key so those callers never share one instance.
    """
    name = model or settings.gemini_model
    key = f"{name}:{temperature}"
    if key not in _cache:
        _cache[key] = ChatGoogleGenerativeAI(
            model=name,
            temperature=temperature,
            google_api_key=settings.gemini_api_key,
            timeout=45,
            max_retries=2,
        )
    return _cache[key]
