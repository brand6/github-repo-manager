Status: ready-for-human

# Structured create project hook

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Let the user create a new native hook from the project `新建 Hook` tab. The form should be structured around the selected tool, config scope, event, matcher, handler type, command or HTTP endpoint, timeout, status text, required env names, and risk notes. Saving writes the selected tool's native project config and records HookHub ownership for the new entry.

This slice should start with Claude project hooks as the first target renderer, then keep the form and API shaped so additional renderers can be added without redesigning the flow.

## Acceptance criteria

- [ ] The `新建 Hook` tab lets the user select a supported target tool and config scope for the selected group path.
- [ ] The form shows only valid event, matcher, and handler fields for the selected tool.
- [ ] The form supports command hooks with command, timeout, status text, required env names, and risk notes.
- [ ] The form shows the target config path and rendered hook entry before saving.
- [ ] Saving a Claude project hook writes `.claude/settings.json` or `.claude/settings.local.json` under `hooks`.
- [ ] Saving preserves unrelated settings and unrelated hook entries.
- [ ] Saving records `projectId`, target group path, `toolId`, `hookId`, config path, scope, managed entry key, source, and applied time.
- [ ] The saved hook appears as managed in `本地 Hooks`.
- [ ] API and UI tests cover structured creation, invalid field prevention, render preview, file preservation, and ownership recording.

## Blocked by

- .scratch/hookhub-hook-management/issues/02-discover-project-native-hooks.md

