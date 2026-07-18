# Supabase SQL Setup

These files are the human-readable source copies for the schema.
For automatic Supabase application, use the mirrored files under `supabase/migrations/` and the GitHub Action in [\.github/workflows/supabase-db-push.yml](../.github/workflows/supabase-db-push.yml).

Run these scripts in Supabase SQL Editor in order:

1. `001_user_profiles.sql`
2. `002_roadmap_progress.sql`
3. `003_delete_own_roadmap_account.sql`

Notes:
- These scripts create profile and roadmap progress tables.
- Row Level Security (RLS) is enabled.
- Policies are included for authenticated access.
- A trigger keeps `public.user_profiles` in sync when a new auth user is created.
- The delete-account function removes the auth user and lets cascading foreign keys clear related roadmap data.

Automation note:
- Set the `SUPABASE_DB_URL` secret in GitHub so the workflow can push migrations on each main-branch check-in.
