Status: ready-for-human

# Apply HookHub template to project

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Let the user apply a center HookHub template from the project `HookHub Hooks` tab to the selected root/subproject group. Applying should render the template through the selected tool's native renderer, substitute supported variables such as `${PROJECT_ROOT}`, write the target config file, and record ownership so the hook can later be disabled safely.

## Acceptance criteria

- [ ] `HookHub Hooks` lists center templates with support status for the selected group and tool targets.
- [ ] Applying a template prompts for scope, variables, and required env-name confirmation when needed.
- [ ] Applying writes the selected tool's native project hook config for the selected group path.
- [ ] Applying preserves unrelated settings and unrelated hook entries.
- [ ] `${PROJECT_ROOT}` expands to the selected group path when rendering.
- [ ] Applying records managed ownership for the rendered entry.
- [ ] Disabling a managed hook removes only the matching managed entry from the selected config path.
- [ ] Disabling never removes an unmanaged same-name or same-event hook without a binding.
- [ ] API and UI tests cover applying, variable substitution, preserving unrelated config, ownership recording, and disabling managed entries.

## Blocked by

- .scratch/hookhub-hook-management/issues/01-build-hookhub-center-template-library.md
- .scratch/hookhub-hook-management/issues/02-discover-project-native-hooks.md

