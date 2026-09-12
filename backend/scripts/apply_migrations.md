# Supabase migrations

SQL files are **not** shell commands. Run them in the Supabase dashboard:

1. Open [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Copy the contents of `backend/supabase/migrations/000_reports_base.sql`
3. Click **Run**
4. If the table already exists, run `001_verification_columns.sql` instead (adds verification columns)

Or with Supabase CLI (if installed):

```powershell
cd backend
supabase db push
```
