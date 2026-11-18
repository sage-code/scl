# Community Portal

Community area for Sage-Code Laboratory.

## Structure

- `index.html`: community portal with curated and VCP graduate listings.
- `members.json`: curated legacy member list.
- `members.js`: loads the curated list and the public VCP directory API, then paginates both.
- `vcp/*.html`: individual member profile pages.
- `template.html`: baseline profile template for new member pages.
- `profile.html`: shared public profile template for database-backed VCP members.
- `profile.js`: loads a published profile by its public ID.

## Notes

- SCL is open source. Any developer can add their own profile page (`vcp/<member>.html`) and list the projects they want to promote, by making a PR for the SCL project or by contacting @elucian or another mentor on Discord. PRs are reviewed and merged in the main branch.
- Profile routes are standardized under `/community/vcp/<member>.html`.
- Database-backed profiles use `/community/profile/<public-id>/`. The public API returns only profiles that opted into publication, have a verified account, and still meet the current A/B/C quiz qualification.
