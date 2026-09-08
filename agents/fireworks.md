# Fireworks Configuration for Sage-Code SCL

## Purpose

Shared configuration for the low-cost **worker models** running on Fireworks serverless inference. This file is the single source of truth for Fireworks-specific details and is referenced by:

- `agents/deepseek/README.md` — DeepSeek agent instructions
- `agents/glm/README.md` — GLM agent instructions

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

### Python (OpenAI SDK)

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["FIREWORKS_API_KEY"],
    base_url="https://api.fireworks.ai/inference/v1",
)
response = client.chat.completions.create(
    model="accounts/fireworks/models/deepseek-v4-flash-0731",
    messages=[{"role": "user", "content": "Summarize the diff below..."}],
    max_tokens=512,
)
print(response.choices[0].message.content)
print(response.usage)  # source of truth for billed tokens
```

---

## 2. Recommended Models

> **Pricing and IDs as of 2026-09.** Model slugs rotate as new versions ship — always re-verify the current ID at [fireworks.ai/models](https://fireworks.ai/models) before pinning it in a script or client config.

| Model | Serverless ID | Context | Input $/M | Output $/M | Role |
|---|---|---|---|---|---|
| DeepSeek V4 Flash (0731) | `accounts/fireworks/models/deepseek-v4-flash-0731` | 1,048,576 | $0.22 | $0.66 | **Default worker** |
| DeepSeek V4 Pro (0813) | `accounts/fireworks/models/deepseek-v4-pro-0813` | 1,048,576 | $1.32 | $3.96 | Quality tier |
| GLM 5.2 | `accounts/fireworks/models/glm-5p2` | 1,048,576 | $1.40 | $4.40 | GLM default |
| GLM 5.3 Flash | verify slug in model library | 1,048,576 | $0.15 | $0.50 | **Cheapest tier** |

Selection rules:

- **Default worker:** DeepSeek V4 Flash — best price/performance for high-volume mechanical tasks.
- **Quality escalation inside Fireworks:** DeepSeek V4 Pro when Flash output fails validation twice.
- **Cheapest tier:** GLM 5.3 Flash for drafting, rewording, and normalization where output is easy to verify.
- All IDs use the `accounts/fireworks/models/<slug>` prefix.

---

## 3. Cost Levers (in order of impact)

1. **Output discipline — the dominant lever.** Output tokens cost 2–3× input tokens on these models. Emit diffs and patches, never full-file rewrites. Set explicit `max_tokens` per task type.
2. **Prompt caching (on by default).** Cached input tokens are billed at **50% of the input rate**. See section 4 for hit-rate discipline.
3. **Batch inference.** Billed at **50% of standard serverless rates** on both input and output. Use for async bulk jobs (content drafting, metadata generation, multi-file transformations). Not for interactive work.
4. **Worker/premium split.** DeepSeek/GLM handle high-volume, well-specified, mechanically verifiable tasks. Deep architectural reasoning and ambiguous design work go to the premium model (Gemini/Claude) — guessing in-session with a cheap model burns retries and produces rework.

---

## 4. Prompt Caching Best Practices

Caching is **replica-local and on by default** for every serverless model. Discount: cached input = 50% of input price.

To maximize hit rate:

- **Freeze the system-prompt prefix.** The instructions/system message must be byte-identical and come first in every request. Never reorder, never inline-edit it mid-session. Edit `agents/<model>/README.md` only between sessions, not during.
- **Keep the prefix stable.** Structure prompts as: `system prompt (frozen) → repo context (stable) → task (variable)`. Variable content must come last.
- **Pin the replica.** Send a stable identifier in the `x-session-affinity` header (or the OpenAI `user` field) per session so repeated prefixes route to the same replica.
- **Batch same-prefix requests** into one session rather than scattering them across new sessions.
- **Read the truth from `usage`** in each response (`prompt_tokens`, `completion_tokens`) and from cache-related rate-limit headers on non-streamed responses. Streaming responses hide per-request perf headers unless `perf_metrics_in_response` is set.

---

## 5. Client Configuration (Cline / OpenAI-compatible tools)

| Setting | Value |
|---|---|
| Provider type | OpenAI Compatible |
| Base URL | `https://api.fireworks.ai/inference/v1` |
| API key | `FIREWORKS_API_KEY` (env var) |
| Model ID | One of the IDs in section 2 |

Output-token guardrails by task type (set as `max_tokens`):

- Diff/patch generation: 512–1,024
- Single topic page draft: 2,048–4,096
- JSON metadata: 1,024
- Bulk batch jobs: per-item caps × batch size, reviewed before launch

---

## 6. Escalation Protocol

Cheap workers must fail fast, not burn tokens:

1. After **2 failed validation passes** on the same task, stop and escalate to the premium model (Gemini/Claude) with a summary of what failed.
2. If a task requires deep architectural reasoning, ambiguous-requirement resolution, or cross-system design → delegate to the premium model directly. Do not attempt it in-session.
3. Escalation summaries must include: task, files touched, failure reason, tokens spent.

---

## 7. Validation Gate

All worker-model output must pass deterministic validation **before acceptance**:

```bash
npm run build    # generate public/ (no validation)
npm run test     # verify source files (originals)
npm run check    # verify generated public/ output
```

Additional checks for structured output:

- JSON metadata: strict parse + hierarchy validation (each `h2` entry contains a `children` array of `h3` anchors; flat lists are rejected).
- Topic pages: exactly one `h1`, multiple `h2`, `h3` under every `h2`.
- Generated artifacts land only in `public/` via the build — never hand-edited.

---

## 8. References

- Model library: https://fireworks.ai/models
- Serverless overview (billing, caching, headers): https://docs.fireworks.ai/serverless/overview.md
- Prompt caching guide: https://docs.fireworks.ai/guides/prompt-caching
- Batch inference: https://docs.fireworks.ai/guides/batch-inference
- OpenAI compatibility: https://docs.fireworks.ai/tools-sdks/openai-compatibility.md
- Recommended models (migration guide): https://docs.fireworks.ai/guides/recommended-models.md

