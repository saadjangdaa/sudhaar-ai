"""Single place where an OpenAI client is constructed. OpenAI only — no other providers."""

from langchain_openai import ChatOpenAI

from app.config import settings

_cache: dict[str, ChatOpenAI] = {}


def get_llm(temperature: float = 0.2, model: str | None = None) -> ChatOpenAI:
    """A cached ChatOpenAI. Never called when settings.mock_agents is true."""
    name = model or settings.openai_model
    key = f"{name}:{temperature}"
    if key not in _cache:
        _cache[key] = ChatOpenAI(
            model=name,
            temperature=temperature,
            api_key=settings.openai_api_key,
            timeout=45,
            max_retries=2,
        )
    return _cache[key]
