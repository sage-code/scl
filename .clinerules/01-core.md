# Core — Sage-Code SCL (always active)

Frozen rules that apply to every task. Keep these stable within a session (they form the Static Context Prefix for cache alignment).

## Shell & temp
- POSIX Bash (Git Bash on Windows) only — never PowerShell (`pwsh`) or `cmd`.
- All intermediate files, logs, plans and task reports go to `.temp/` (repo root, git-ignored; `mkdir -p .temp` first). Never `/tmp`.

## Command tracing (mandatory)
- Every command you execute MUST run through `scripts/tools/trace.sh`:
  - `trace.sh <command [args...]>` or `trace.sh -c '<full command with pipes/redirects>'`
- trace.sh appends one line to `.temp/trace.log`: timestamp, OK|FAIL, label, duration-ms, command.
- Diagnose failures with `trace.sh report` / `trace.sh tail [N]`, never by blind retries.

## Token discipline
- Diff-first: `git status` / `git diff` / targeted range reads / regex searches before whole-file reads.
- Never read entire `public/` trees or generated assets.
- Emit diffs/patches, not full-file rewrites. No greetings, recaps, or filler.
- Batch independent tool calls into a single turn.

## Validation gate (in order)
1. `npm run test`   — source originals
2. `npm run build`  — assemble `public/` (`build:full` for clean rebuild)
3. `npm run check`  — audit compiled output

## Escalation (DeepSeek only)
- Executor = DeepSeek V4 Flash → Planner = DeepSeek V4 Pro. No other vendors unless configured by the user.
