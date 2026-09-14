# File Editing — Sage-Code SCL (always active)

Tool-name mapping for this environment:
- `write_to_file` ≈ `editor` **create** (new files only)
- `replace_in_file` / `apply_diff` ≈ `editor` **replace** (`old_text` / `new_text` with context)
- `read_file` ≈ `read_files`

# STRICT FILE EDITING RULES & CORRUPTION PREVENTION PROTOCOL

1. EXCLUSION OF FULL REWRITES: Never use full-file write tools (`write_to_file`) on existing files. Full rewrites are restricted ONLY to newly created files.
2. MANDATORY DIFF TOOLING: Modify existing files strictly using `replace_in_file` (or `apply_diff`) with precise SEARCH/REPLACE blocks.

## SEARCH/REPLACE BLOCK REQUIREMENTS
- **Exact Indentation & White Space:** The content inside `SEARCH` must match the exact byte-for-byte state of the target file.
- **Context Anchors:** Every `SEARCH` block MUST include 3 to 5 lines of unchanged, unique code *above* and *below* the modifications.
- **Uniqueness Check:** Ensure the block matched in `SEARCH` exists EXACTLY ONCE in the target file. If it appears in multiple places, expand the anchor lines until it is unique.

## INTEGRITY & DRIFT PREVENTION
- **Zero Placeholders:** NEVER use placeholder comments (e.g., `// ... keep existing code ...` or `/* unchanged */`). Output exact, complete code within the `REPLACE` block.
- **Read-Before-Retry on Failure:** If a diff patch fails to apply, DO NOT guess or attempt manual line offsets. Call `read_file` immediately to sync with the current disk state, re-verify the context, and re-issue the diff block.
- **Granular Edits:** Prefer multiple small, targeted SEARCH/REPLACE blocks over one large block spanning tens of unchanged lines.

## BULK & GENERATOR SCRIPTS (interplay with 03-execution-protocol)
- Deterministic Python scripts in `scripts/tools/` may fully write ONLY newly created files.
- Any update to an existing file from a script must go through the same SEARCH/REPLACE discipline; recovery/generator scripts must never silently overwrite existing tracked content.
