# Deebug — Issues Found

## Critical
1. **Hardcoded API key** in `packages/pipeline/src/utils/llm.ts:71` — Groq key committed in source. Must move to env var.
2. **Prisma query engine lock on OneDrive** — `npm run build/typecheck` fails with EPERM rename of `query_engine-windows.dll.node` due to OneDrive sync. Move project out of OneDrive or disable sync.

## High
3. **Uncommitted worktree changes** — many modified/new files not committed (git status shows 14+ changed).
4. **Database file committed** — `packages/db/prisma/codeanalyzer.db` tracked in git; should be gitignored.
5. **Missing `.env`** — only `.env.example` exists; keys must be provided.

## Medium
6. **Lint/typecheck pipeline blocked** by db build failure, so verification impossible in current location.
7. **Hardcoded paths/Windows-only** assumptions in scripts.

## Low
8. README uses placeholder emoji mojibake (`??`) in headings.
9. `progress-summary.md` and test scripts left in repo root.
