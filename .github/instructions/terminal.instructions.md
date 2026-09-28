---
description: "Use when running shell commands, builds, tests, git operations, or any terminal task in this repo. Covers the POSIX Bash requirement, .temp/ spooling, trace.sh command tracing, the run.sh CLI, background commands, and the validation gate."
---

# Terminal & Shell Conventions

All shell work in this repo follows the same rules. They are also summarized in
[`.github/copilot-instructions.md`](../copilot-instructions.md) and the agent profiles under
[`agents/`](../../agents/instructions.md); this file is the detailed reference.

## Shell

- Use **POSIX Bash only** — Git Bash on Windows or the GitHub terminal. Never PowerShell (`pwsh`) or `cmd`.
- The VS Code default terminal profile is already Git Bash (see `.vscode/settings.json`).
- Prefer `[[ ]]` over `[ ]`, and `$(...)` over backticks.
- Never create a sub-shell (`bash -c "..."`) unless the command genuinely needs it.

## Temp spooling

- Write every intermediate file, log, plan, and task report to the repo-root **`.temp/`** directory
  (git-ignored). Run `mkdir -p .temp` first.
- **Never use `/tmp`** or any OS temp directory.
- Redirect long-running command output to `.temp/` and page it with `grep` / `head` / `tail`.

## Command tracing (mandatory)

Every command you execute must run through `scripts/tools/trace.sh`, which appends
`timestamp · OK|FAIL · label · duration-ms · command` to `.temp/trace.log`:

```bash
scripts/tools/trace.sh npm run build
scripts/tools/trace.sh --label build -c 'npm run build > .temp/build.log 2>&1'
```

- Use `-c '<full command>'` for pipes, redirections, and `&&` chains.
- Diagnose failures with `scripts/tools/trace.sh report` or `scripts/tools/trace.sh tail [N]` —
  never re-run blindly.

## Project CLI

`run.sh` is the unified maintenance wrapper (alias `run`). Prefer it over raw npm scripts:

```bash
./run.sh --help
```

| Command | Effect |
|---------|--------|
| `clean` | Remove build artifacts |
| `build` | Generate `public/` (no validation) |
| `rebuild` | Clean + full build |
| `test` | Verify source originals |
| `check` | Audit compiled `public/` output |
| `audit [folder]` | Puppeteer browser audit (default `public`) |
| `commit "msg"` | Stage all + commit (must run from repo root) |
| `publish` | Bump patch version, commit, push |

## Validation gate (in order)

Run these after relevant edits, in this order:

1. `npm run test` — source originals (JSON/JS/Python syntax, sidebar hierarchy)
2. `npm run build` — assemble `public/` (`npm run build:full` for a clean rebuild)
3. `npm run check` — audit compiled output

`npm run build` is generation only; it does not validate. `public/` is build output — never hand-edit it.

## Background commands

- Run long commands in the background with output redirected to `.temp/`, e.g.
  `npm run build > .temp/build.log 2>&1`.
- Page results with `grep` / `head` / `tail`; use `git --no-pager` for git output.
- Do not poll or sleep to wait for completion — wait for the completion signal.

## Git

- Run `./run.sh commit` only from the repo root (`git rev-parse --show-toplevel` must end in `sage-code/scl`).
- Keep commits focused and atomic with clear intent/scope messages.
