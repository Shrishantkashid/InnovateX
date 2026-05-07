from supabase import create_client, Client
from config import settings

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Optional: Service client for admin operations
def get_supabase_admin() -> Client:
    if not settings.SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_SERVICE_KEY is not set")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
