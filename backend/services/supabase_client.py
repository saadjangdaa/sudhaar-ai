import os

from supabase import Client, create_client

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        key = (
            os.environ.get("SUPABASE_KEY")
            or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        )
        if not url or not key:
            raise RuntimeError(
                "Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and "
                "SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in backend/.env"
            )
        _client = create_client(url, key)
    return _client


def set_supabase(client: Client | None) -> None:
    global _client
    _client = client
