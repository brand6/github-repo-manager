Status: ready-for-human

# Distribute HookHub template from center

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Let the user distribute a center HookHub template from the top-level HookHub page to one or more selected project root/subproject groups. This is the center-definition distribution flow: HookHub owns the reusable definition, the user explicitly chooses project targets, and the app writes each target's native hook config through the same renderers and managed binding records used by the project-side apply flow.

This slice should not introduce background global sync. Distribution is a user-triggered operation with target selection, rendered previews, variable resolution, and per-target result reporting.

## Acceptance criteria

- [ ] A center template has a `分发到项目` action on the HookHub page.
- [ ] The distribution flow lets the user select one or more projects and root/subproject groups.
- [ ] The flow shows supported target tools and unsupported tools for each selected group.
- [ ] The user can choose scope and provide variables per target group where needed.
- [ ] The flow previews target config paths and rendered entries before writing.
- [ ] Applying writes native hook config for each selected target and preserves unrelated settings.
- [ ] Applying records managed ownership for each target group and tool.
- [ ] The result summary reports added, updated, skipped unsupported, and failed targets.
- [ ] Distribution never runs as background global sync and never changes projects the user did not select.
- [ ] API and UI tests cover target selection, preview, multi-target apply, ownership recording, skipped unsupported targets, and per-target result summaries.

## Blocked by

- .scratch/hookhub-hook-management/issues/01-build-hookhub-center-template-library.md
- .scratch/hookhub-hook-management/issues/05-apply-hookhub-template-to-project.md

