# Sage-Code SCL — Claude Code instructions

Read `GEMINI.md` and `.clinerules/` for project conventions (POSIX shell, `.temp/` spool, static-site architecture). Those apply here too.

## File Maintenance Tooling
Use `bee-ed` (source: `C:\Users\eluci\sage-code\ed-tool`) for edits to existing files, especially large ones such as `build.js`, so each change is atomic and preserves CRLF/LF line endings.
- Apply a patch: `bee-ed apply <patch> [<file>] [--dry-run]` (multi-file patches; shifted hunks are found)
- Unique edit: `bee-ed edit <file> <old> <new> [--dry-run]` (fails on 0 or >1 matches)
- Append: `bee-ed append <file> <content>` (`--new` requires creating the file)
- Regex replace across files: `bee-ed sed <pattern> <replacement> <glob...> [--dry-run]`
- Search: `bee-ed search <pattern> <glob...> [--count] [--name-only]`
- Validate HTML/Markdown tags: `bee-ed balance <file>` (run after editing `.html`/`.md` content)
- `@path` reads an argument from a file, `@-` from stdin, `@@x` is the literal `@x`. Text starting with `-` is a value; `--` ends flags.
- Always `--dry-run` a `sed` before running it for real.

The built-in Edit/Write/Grep tools remain fine for small changes and new files. Prefer `bee-ed` for bulk `sed`, patches, and `balance` checks.
