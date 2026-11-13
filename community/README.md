# Community Portal

Community area for Sage-Code Laboratory.

## Structure

- `index.html`: community portal with JSON-driven member directory.
- `members.json`: source of truth for listed members.
- `members.js`: client-side pagination and table rendering logic.
- `vcp/*.html`: individual member profile pages.
- `template.html`: baseline profile template for new member pages.

## Notes

- SCL is open source. Any developer can add their own profile page (`vcp/<member>.html`) and list the projects they want to promote, by making a PR for the SCL project or by contacting @elucian or another mentor on Discord. PRs are reviewed and merged in the main branch.
- Profile routes are standardized under `/community/vcp/<member>.html`.
