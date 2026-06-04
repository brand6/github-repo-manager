Status: ready-for-human

# Build HookHub center template library

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Build the top-level `HookHub` center library for reusable hook templates. This slice should let the user open `HookHub`, see templates grouped by tool/event, create and edit center templates, search templates, view public metadata and per-tool native payload summaries, and delete a template without touching project files.

This issue establishes the center-library reuse surface only. It should not write any project hook config files.

## Acceptance criteria

- [ ] A top-level `HookHub` entry is available next to the existing global hub/navigation entries.
- [ ] The HookHub page lists center templates with `hookId`, name, description, supported tools, event, matcher summary, handler type, risk level, required env names, and updated time.
- [ ] The HookHub page can create a reusable template without selecting a project first.
- [ ] The HookHub page can edit center template metadata, variables, risk notes, and supported native payload fields.
- [ ] The app persists HookHub templates as common metadata plus per-tool native payloads.
- [ ] `hookId` is globally unique and stable after creation.
- [ ] HookHub templates can be searched by name, description, tool, event, matcher, handler type, and required env names.
- [ ] Deleting a center template removes it from the center library without touching project files in this slice.
- [ ] API and UI tests cover listing, create, edit, search, deletion, and stable `hookId` behavior.

## Blocked by

None - can start immediately
