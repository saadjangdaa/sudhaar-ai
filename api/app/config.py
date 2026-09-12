"""Runtime configuration. Every value comes from the environment — see .env.example."""

import os
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- OpenAI (the only model provider in this project) ---
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_transcribe_model: str = "gpt-4o-mini-transcribe"

    # --- Supabase (service role: bypasses RLS, server-side only, never shipped) ---
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # --- behaviour ---
    # MOCK_AGENTS=true short-circuits every LLM call to deterministic canned
    # output. The whole loop works, deploys and demos with zero API spend.
    # This is what stage 0 ships; Dev A flips it to false once prompts are real.
    mock_agents: bool = True

    allowed_origins: str = "http://localhost:3000"

    # Used to build a link back to the complaint in the email body.
    web_base_url: str = "http://localhost:3000"

    # --- email (off by default; see app/mailer.py) ---
    enable_email: bool = False
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_app_password: str = ""
    smtp_from_name: str = "Karachi Civic Reports"
    # Safety valve: ALL mail goes here instead of the authority address.
    # The seeded authority emails are placeholders — never mail real departments
    # from a hackathon build. Clearing this is a deliberate decision.
    email_override_to: str = ""

    @model_validator(mode="after")
    def apply_env_fallbacks(self) -> "Settings":
        if not self.supabase_url:
            self.supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
        if not self.supabase_service_role_key:
            self.supabase_service_role_key = os.environ.get(
                "SUPABASE_SERVICE_ROLE_KEY",
                os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
            )
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
