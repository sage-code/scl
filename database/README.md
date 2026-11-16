# Turso Database

Roadmap accounts and progress live in a Turso (libSQL) database, accessed only by
the Vercel functions in [`api/`](../api/). The browser never talks to the database.

## Migrations

Schema files live in [`turso/`](turso/) and are applied in filename order, once
each, by [`scripts/db/migrate.js`](../scripts/db/migrate.js). Applied names are
recorded in the `schema_migrations` table.

- `npm run build` runs migrations first (skipped if the Turso env vars are absent).
- `npm run db:migrate` runs them alone; add `-- --status` to list applied files.
- To change the schema, add a new numbered file (for example `002_add_x.sql`).
  Never edit a file that has already been applied.

## Tables

| Table | Holds |
|---|---|
| `users` | Every visitor. `is_anonymous = 1` until they register; registering fills `handle`, `email`, `password_hash` on the same row |
| `sessions` | SHA-256 hashes of session tokens (the raw token is only in the `scl_sid` cookie), 180-day expiry |
| `email_tokens` | One-time hashed tokens for email confirmation (24 h) and password reset (1 h) |
| `auth_events` | Rate-limit log: failed logins (10 per 15 min per email) and emails sent (3 per hour per user and kind) |
| `roadmap_progress` | Per-user progress rows keyed by `(user_id, roadmap_code, topic_key)` |
| `roadmap_favorites` | Per-user favorites keyed by `(user_id, roadmap_code, topic_key)` |

## Auth model

- **Anonymous users:** the first page load without a session calls
  `POST /api/auth/anonymous`, which creates a user and session. Known bot user
  agents are skipped. Anonymous users idle for 180 days are removed by an
  occasional cleanup that runs during anonymous sign-ups.
- **Register:** upgrades the current anonymous user in place, so progress is kept,
  then emails a confirmation link.
- **Login:** requires a confirmed email. Progress from the anonymous session is
  merged into the account (rows the account already has win), then the anonymous
  user is deleted.
- **Password reset:** the link confirms the email, sets the new password and signs
  out every session for that account.
- **Delete:** removes the user and all their rows explicitly, so it does not rely
  on SQLite foreign-key enforcement.
