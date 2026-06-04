Status: ready-for-human

# Sync suite updates to enabled projects

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Add explicit sync flows for changed HookHub suites. HookHub should sync a changed suite to all already-enabled `project/group + tool` bindings, and project Hook management should update one inconsistent tool or all inconsistent tools in the current project group.

This is not background sync and it should never enable a suite in projects where it was not already bound.

## Acceptance criteria

- [ ] HookHub shows when a suite has `outdated` enabled bindings.
- [ ] HookHub offers `同步到所有已启用项目` for a suite.
- [ ] Batch sync updates only bindings for that suite and only where status is `outdated`.
- [ ] Batch sync skips `drifted`, `missing`, and `invalid` targets and reports them.
- [ ] Project Hook management offers updating one outdated tool from HookHub.
- [ ] Project Hook management offers updating all inconsistent hooks for the current group, limited to existing bindings.
- [ ] Sync makes the project hooks section equal to the current suite payload for that tool.
- [ ] Sync applies added, removed, and changed hooks-section content as a full hooks-section replacement.
- [ ] Sync preserves unrelated settings and records a new applied fingerprint.
- [ ] API and UI tests cover suite-level batch sync, project-level single update, project-level update-all, skipped drifted targets, result summaries, and no new bindings for unenabled projects.

## Blocked by

- .scratch/hookhub-hook-management/issues/05-apply-suite-with-replacement-and-backup.md
- .scratch/hookhub-hook-management/issues/06-add-codex-qwen-qoder-renderers.md

