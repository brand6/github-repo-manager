Status: ready-for-human

# Apply suite with replacement and backup

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Let the user apply a HookHub suite to a selected `project/group + tool`. Applying a suite replaces that tool's entire `hooks` section, preserves unrelated settings, records binding ownership, and protects the previous config through Git checkpointing or local project backup before destructive replacement.

## Acceptance criteria

- [ ] A suite can be applied from HookHub or the project panel to a selected group/tool when that suite has a payload for the target tool.
- [ ] Applying replaces only the target tool's `hooks` section and preserves unrelated settings.
- [ ] Applying records one binding for the selected `project/group + tool`.
- [ ] If the target already has another suite binding and is not drifted, applying a new suite replaces the old suite binding after confirmation.
- [ ] If the target is unmanaged, applying offers `覆盖`, `把当前 hooks 上传到 HookHub 后覆盖`, and `取消`.
- [ ] If the target is drifted and bound to suite A, applying suite B offers `覆盖`, `用当前 hooks 覆盖 suite A 后再覆盖`, `把当前 hooks 另存为新 suite 后再覆盖`, and `取消`.
- [ ] If the target is outdated, applying a new suite only confirms replacement and does not offer upload/save options.
- [ ] Before replacement, Git-managed dirty config files are committed with `chore: HookHub 覆盖前备份 <file>`.
- [ ] Git repo untracked config files are not auto-committed and get a local backup plus explicit commit option.
- [ ] Non-Git or non-managed files get a full-file backup under `.hookhub/backups/` with metadata.
- [ ] API and UI tests cover normal apply, suite replacement, unmanaged options, drifted options, outdated replacement, Git checkpoint, untracked handling, local backup, and binding updates.

## Blocked by

- .scratch/hookhub-hook-management/issues/01-build-hookhub-suite-library.md
- .scratch/hookhub-hook-management/issues/02-discover-project-tool-hook-state.md
- .scratch/hookhub-hook-management/issues/04-share-project-tool-hooks-to-hookhub.md

