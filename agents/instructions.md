# Instructions for Managing Agents

This directory contains configuration and instructions for different AI agents used in this project.
Each agent has its own subfolder containing specific instructions.

- `/gemini`: Instructions and configuration for Gemini.
- `/claudio`: Instructions and configuration for Claudio.
- `/copilot`: Instructions and configuration for GitHub Copilot.
- `/deepseek`: DeepSeek Planner instructions (architect/thinker — roadmap improvement and long-running plans; Plan mode).
- `/deepseek/executor.md`: DeepSeek Executor instructions (acting model — precise execution, command tracing, minimal feedback; Act mode).
- `fireworks.md`: Shared Fireworks configuration (endpoint, model IDs, pricing, Static Context Prefix / prompt caching, escalation, validation, shared shell & temp rules) used by the DeepSeek Planner and Executor.
- `static-context-prefix.md`: Frozen system prefix — loaded first, byte-identical, in every request (cache alignment).

## Cline integration
- Project rules: `.clinerules/` — `01-core.md` (core + tracing), `02-architecture.md` (static site architecture), `03-execution-protocol.md` (acting protocol).
- Skills: `.cline/skills/` — `architecture`, `build-validate`, `author-topic` (on-demand, minimal token cost).
- Command tracing: `scripts/tools/trace.sh` → `.temp/trace.log` (status + duration per command).

Shared shell conventions (apply to every agent in this folder): POSIX Bash only (Git Bash on Windows / GitHub terminal — never PowerShell); spool all temporary/intermediate files and command logs to the repo-root `.temp/` directory (git-ignored, `mkdir -p .temp` first); run every command through `scripts/tools/trace.sh`; run long commands in the background with output redirected to `.temp/` and page results with `grep`/`head`/`tail` and `git --no-pager`. Full details in `fireworks.md` §8 and each model's instructions.
