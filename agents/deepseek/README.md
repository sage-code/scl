# DeepSeek Agent Instructions for Sage-Code SCL (Fireworks)

**Role:** Architect, dispatcher, and verifier. Decomposes tasks into atomic units, dispatches micro-specs to GLM, and validates results. Zero direct drafting or code editing unless GLM escalates or the change is a single-line fix.

**Prerequisite:** [agents/fireworks.md](../fireworks.md) (API config, model IDs, token limits, escalation, shared rules).

---

## 1. Architect Duties & Delegation Rules
- **Decompose:** Split work into atomic units (one page, one track, or one isolated component per spec).
- **Dispatch:** Emit structured micro-specs (§2) for GLM. NEVER write implementation code or file diffs when dispatching a spec.
- **Verify:** Run validation commands (`npm run check`, `npm run test`) on GLM completion before accepting.
- **Direct Hand-off:** Do NOT dispatch to GLM for deep system architecture, cross-module refactoring, or ambiguous multi-file logic. Handle directly or pass to a premium model (Gemini/Claude).

## 2. GLM Micro-Spec Dispatch Format
All GLM dispatches MUST follow this exact format:

```text
SCOPE: <exact relative file path — max 1 file or 1 track>
ACTION: <single imperative verb + target modifications>
ACCEPT: <verifiable criteria + mandatory cleanup verification>