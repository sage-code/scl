# Community Portal

Community area for Sage-Code Laboratory.

## Structure

- `index.html`: community portal with JSON-driven member directory.
- `members.json`: source of truth for listed members.
- `members.js`: client-side pagination and table rendering logic.
- `vip/*.html`: individual member profile pages.
- `template.html`: baseline profile template for new member pages.

## Notes

- This project is protected. Only Sage-Code mentors should modify member profile content.
- Profile routes are standardized under `/community/vip/<member>.html`.
