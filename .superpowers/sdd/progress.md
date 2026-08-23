# Material Variance — Subagent Progress Ledger

Plan: `docs/superpowers/plans/2026-08-23-material-variance.md`
Branch: `feat/material-variance`

## Tasks

- [x] Task 1: complete (commits 4367711..394ab02, review clean)
- [x] Task 2: complete (commits 394ab02..ab00a3f, review clean)
- [x] Task 3: complete (commits ab00a3f..7e88c88, review clean)
- [x] Task 4: complete (commits 7e88c88..3874851, review clean after PropTypes)
- [x] Final review fixes: b9b20a8 (tsc applyLines + real router test)

## Minor findings (for final review)

- Task 2: row key uses `split(":")` (Mongo ObjectIds have no colons); no explicit tests for `scope=all` summaries or `completedAt: null`
- Task 2/3: `tsc` error in `buildMaterialVariance` — `getRecipeForSize` ingredients `storageItemId` is `string | ObjectId` vs `VarianceRecipeLine.storageItemId: string`
- Task 3: route test mounts controller directly and omits `isVerifiedUser` (does not exercise production router)

