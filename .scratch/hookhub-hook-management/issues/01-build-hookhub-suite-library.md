Status: ready-for-human

# Build HookHub suite library

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Build the top-level `HookHub` suite library. This slice should let the user open `HookHub`, create a hook suite from 0, edit suite metadata and tool payloads, list suites, search suites, delete a suite, and rely on globally unique suite names.

This issue establishes the center reuse surface only. It should not write any project hook config files.

## Acceptance criteria

- [ ] A top-level `HookHub` entry is available next to existing global hub/navigation entries.
- [ ] The HookHub page lists suites with `suiteId`, globally unique `name`, description, supported tools, risk notes, required env names, and updated time.
- [ ] The HookHub page can create a suite without selecting a project first.
- [ ] The HookHub page can edit suite metadata and tool hooks payloads.
- [ ] Suite `name` is globally unique across HookHub and can be renamed only to another unique name.
- [ ] Suite `suiteId` is stable and remains the internal binding key after rename.
- [ ] A suite can contain multiple tool payloads, with at most one complete hooks payload per tool.
- [ ] HookHub suites can be searched by name, description, tool, risk notes, and required env names.
- [ ] Deleting a suite removes it from the center library without touching project files in this slice.
- [ ] API and UI tests cover listing, create, edit, rename uniqueness, multi-tool payloads, search, deletion, and stable `suiteId` behavior.

## Blocked by

None - can start immediately

