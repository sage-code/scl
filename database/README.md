# Supabase SQL Setup

Run these scripts in Supabase SQL Editor in order:

1. `001_user_profiles.sql`
2. `002_roadmap_progress.sql`

Notes:
- These scripts create profile and roadmap progress tables.
- Row Level Security (RLS) is enabled.
- Policies are included for authenticated access.
- A trigger keeps `public.user_profiles` in sync when a new auth user is created.
