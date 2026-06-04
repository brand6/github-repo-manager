Status: ready-for-human

# Sync project hook to HookHub

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Let the user select a local project hook from `本地 Hooks` and save it as a reusable HookHub template. The sync flow should extract common metadata, preserve the tool-native payload, and prompt for template name, description, variables, required env names, and risk notes. Syncing must not rewrite the project config file.

This slice turns project-side hook creation into a reusable library workflow, which is the key difference from McpHub.

## Acceptance criteria

- [ ] Managed and unmanaged local hooks expose a `同步到 HookHub` action.
- [ ] The sync dialog pre-fills tool, event, matcher, handler type, command or endpoint summary, and required env names from the native config.
- [ ] The user can provide template name, description, variables, required env names, and risk notes before saving.
- [ ] Syncing creates a HookHub template with common metadata plus the selected tool's native payload.
- [ ] Syncing an existing managed template can update the center template only after explicit confirmation.
- [ ] Syncing does not modify the source project hook config file.
- [ ] The center HookHub list shows the newly synced template.
- [ ] API and UI tests cover unmanaged sync, managed update confirmation, native payload preservation, and no-file-rewrite behavior.

## Blocked by

- .scratch/hookhub-hook-management/issues/02-discover-project-native-hooks.md

