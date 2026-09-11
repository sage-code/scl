# Fireworks Configuration for Sage-Code SCL

## Purpose

Shared configuration for the **DeepSeek models** running on Fireworks serverless inference and for **Cline** (OpenAI-compatible client). This file is the single source of truth for Fireworks-specific details. Referenced by:

- `agents/static-context-prefix.md` — frozen system prefix (load first in every request)
- `agents/deepseek/README.md` — DeepSeek Planner instructions (architect / thinker)
- `agents/deepseek/executor.md` — DeepSeek Executor instructions (acting model)

Keep API/pricing/caching details here. Keep model-behavior instructions in the per-model files.

---

## 1. API Endpoint & Authentication

Fireworks exposes an **OpenAI-compatible API**. Any OpenAI SDK or tool that accepts a custom `base_url` works without changes.

- **Base URL:** `https://api.fireworks.ai/inference/v1`
- **Auth header:** `Authorization: Bearer $FIREWORKS_API_KEY`
- **Env var:** `FIREWORKS_API_KEY` (store in local env or secret manager; never commit)

### curl

```bash
curl https://api.fireworks.ai/inference/v1/chat/completions \
  -H "Authorization: Bearer $FIREWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "accounts/fireworks/models/deepseek-v4-flash-0731",
    "messages": [{"role": "user", "content": "Summarize the diff below..."}],
    "max_tokens": 512
  }'
```

### Python (OpenAI SDK with Cache Alignment)

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["FIREWORKS_API_KEY"],
    base_url="https://api.fireworks.ai/inference/v1",
)

# FROZEN_SYSTEM_PREFIX = byte-identical copy of agents/static-context-prefix.md
response = client.chat.completions.create(
    model="accounts/fireworks/models/deepseek-v4-flash-0731",
    messages=[
        {"role": "system", "content": FROZEN_SYSTEM_PREFIX},
        {"role": "user", "content": f"{STABLE_CONTEXT}\n\n{VARIABLE_TASK}"},
    ],
    extra_headers={"x-session-affinity": "sage-code-build-session"},
    max_tokens=1024,
)
print(response.choices[0].message.content)
print(response.usage)  # source of truth for billed tokens and cache hits
```

---

## 2. Recommended Models (DeepSeek only)

> **Pricing and IDs as of 2026-09.** Model slugs rotate as new versions ship — always re-verify the current ID at [fireworks.ai/models](https://fireworks.ai/models) before pinning it in a script or client config.

| Model | Serverless ID | Context | Input $/M | Output $/M | Role |
|---|---|---|---|---|---|
| DeepSeek V4 Flash (0731) | `accounts/fireworks/models/deepseek-v4-flash-0731` | 1,048,576 | $0.22 | $0.66 | **Default executor (acting, Act mode)** |
| DeepSeek V4 Pro (0813) | `accounts/fireworks/models/deepseek-v4-pro-0813` | 1,048,576 | $1.32 | $3.96 | **Planner (architect/thinker, Plan mode) + quality escalation** |

Selection rules:

- **Executor (Act mode):** DeepSeek V4 Flash — best price/performance for high-volume mechanical tasks.
- **Planner (Plan mode):** DeepSeek V4 Pro — deeper reasoning for roadmap design and long-running plans.
- **Quality escalation stays in DeepSeek:** V4 Pro when Flash output fails validation; retries remain in-session and never leave the DeepSeek family unless the user configures otherwise.
- All IDs use the `accounts/fireworks/models/<slug>` prefix.

---

## 3. Cost Levers (in order of impact)

1. **Output discipline — the dominant lever.** Output tokens cost 2–3× input tokens on these models. Emit diffs and patches, never full-file rewrites. Set explicit `max_tokens` per task type.
2. **Static Context Prefix + cache alignment (§4).** A stable, byte-identical prefix routes every request through the same cached prefix at 50% input price.
3. **Diff-first context.** Use `git diff`/`git status` and targeted range reads instead of whole-file dumps.
4. **Defer hard reasoning to the planner.** Deep architectural work happens in the Planner session (V4 Pro). Guessing in the executor session burns retries and produces rework.

---

## 4. Static Context Prefix & Prompt Caching

Caching is **replica-local and on by default** for every serverless model. Discount: cached input = 50% of input price.

Every request MUST keep this fixed order:

```
[FROZEN_SYSTEM_PREFIX] → [STABLE_REPO_CONTEXT] → [VARIABLE_TASK]
```

- **FROZEN_SYSTEM_PREFIX:** byte-identical copy of `agents/static-context-prefix.md`. Loaded first in the system message. Never reorder, never inline-edit mid-session. Edit only between sessions.
- **STABLE_REPO_CONTEXT:** architecture/skill material that only changes between sessions, not during.
- **VARIABLE_TASK:** the micro-spec or user request — always last.

To maximize hit rate:

- Freeze the system-prompt prefix (see above).
- Pin the replica: send a stable identifier in the `x-session-affinity` header (or the OpenAI `user` field) per session so repeated prefixes route to the same replica.
- Batch same-prefix requests into one session rather than scattering across sessions.
- Read truth from `usage` in each response (`prompt_tokens`, `completion_tokens`) and from cache-related headers on non-streamed responses.

---

## 5. Client Configuration (Cline / OpenAI-compatible tools)

| Setting | Value |
|---|---|
| Provider type | OpenAI Compatible |
| Base URL | `https://api.fireworks.ai/inference/v1` |
| API key | `FIREWORKS_API_KEY` (env var) |
| Model (Plan mode) | `accounts/fireworks/models/deepseek-v4-pro-0813` |
| Model (Act mode) | `accounts/fireworks/models/deepseek-v4-flash-0731` |

Output-token guardrails by task type (set as `max_tokens`):

- Diff/patch generation: 512–1,024
- Single topic page draft: 2,048–4,096
- JSON metadata / trace report: 1,024
- Bulk batch jobs: per-item caps × batch size, reviewed before launch

---

## 6. Escalation Protocol & Status Tokens

Models fail fast to preserve token budgets:

1. **Status Tokens:**
   - `REJECT: AMBIGUOUS_SPEC` → Planner clarifies spec context and re-dispatches once.
   - `ESCALATE: VALIDATION_FAILED` → escalated immediately upon 2 consecutive validation failures.
2. After **2 failed validation passes** on the same task, the executor stops and hands back with: `TASK`, `FILES_TOUCHED`, `FAILURE_REASON`, `TOKENS_SPENT` (from the trace log).
3. Deep architectural reasoning, ambiguous-requirement resolution, or cross-system design → Planner session (DeepSeek V4 Pro). Do not attempt it in the executor session.

---

## 7. Validation Gate

All model output must pass deterministic validation in exact sequence before acceptance:

```bash
npm run test     # 1. Verify source file syntax, schema integrity, and links
npm run build    # 2. Assemble static site artifacts into public/
npm run check    # 3. Audit compiled public/ output and inline script extractions
```

Every run goes through the trace wrapper: `trace.sh npm run test`, etc.

---

## 8. Shared Shell & Temp-File Rules (applies to all agents)

- **Shell:** POSIX Bash only (Git Bash on Windows / GitHub terminal). Never PowerShell (`pwsh`) or `cmd`.
- **Command tracing:** run every command via `scripts/tools/trace.sh` so `.temp/trace.log` records status + duration. Investigate with `trace.sh report` / `trace.sh tail`.
- **Temp spool:** all temporary/intermediate files (logs, script output, scratch data, plans, task reports) go to `.temp/` at the repo root — `mkdir -p .temp` if missing. Never `/tmp`. `.temp/` is git-ignored; the executor cleans scratch files after a task but keeps `trace.log` and the task report for inspection.
- **Long commands & timeouts:** run long commands with output redirected to `.temp/` (e.g. `trace.sh -c 'npm run build > .temp/build.log 2>&1'`), then `tail` the log. Avoid interactive pagers and prompts (`git --no-pager`, `--non-interactive`, page with `grep`/`head`/`tail`).
