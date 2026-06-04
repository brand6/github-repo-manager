Status: ready-for-human

# Migrate local MCP into McpHub

## Parent

.scratch/mcphub-mcp-management/PRD.md

## What to build

Let the user migrate local unmanaged MCP entries from the `本地 MCP` tab into the McpHub center library. Migration should normalize the local entry, create or update the center server according to the same-id rules, establish bindings for the selected group and discovered targets, and record ownership without immediately rewriting project files.

This slice turns existing hand-written project MCP into managed McpHub entries while leaving working files untouched at migration time.

## Acceptance criteria

- [x] A local unmanaged MCP entry can be migrated from `本地 MCP` into the center library.
- [x] Migration groups same `serverId` entries across Claude, Codex, and OpenCode target files for the selected group.
- [x] If same-id entries across targets normalize to equivalent core definitions, one center server is created or updated and bindings are recorded for all matching targets.
- [x] If same-id entries across targets normalize to different core definitions, migration is blocked with the conflicting target list.
- [x] If the center library already has the same `serverId` with equivalent config, migration links to the existing center server.
- [x] If the center library already has the same `serverId` with different config, migration requires an explicit choice between linking existing and overwriting McpHub.
- [x] Migration writes applied ownership records for the selected group and targets.
- [x] Migration does not rewrite `.mcp.json`, `.codex/config.toml`, or `opencode.json`.
- [x] After migration, the entry appears as managed in `本地 MCP` and selected in `McpHub MCP`.
- [x] Tests cover single-target migration, multi-target equivalent migration, conflicting migration, link-existing, overwrite-McpHub, and no-file-rewrite behavior.

## Blocked by

- .scratch/mcphub-mcp-management/issues/02-import-json-into-mcphub.md
- .scratch/mcphub-mcp-management/issues/05-discover-local-mcp-in-project-groups.md
