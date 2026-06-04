Status: ready-for-human

# Apply McpHub MCP to Claude project config

## Parent

.scratch/mcphub-mcp-management/PRD.md

## What to build

Build the first project-side tracer bullet: every project root/subproject group exposes an `MCP` action, the side panel includes `本地 MCP` and `McpHub MCP` tabs, and the `McpHub MCP` tab can apply or disable a center server for Claude Code in the selected group path.

This slice should write only Claude Code project-level `.mcp.json`, record the applied ownership, and delete only managed Claude entries when disabled.

## Acceptance criteria

- [x] Each existing project detail root/subproject group has an `MCP` button.
- [x] Clicking `MCP` opens a side panel scoped to that group's full path.
- [x] The side panel includes `本地 MCP` and `McpHub MCP` tabs.
- [x] `McpHub MCP` lists center-library servers and the supported `claude` target for this slice.
- [x] Applying a `stdio` or `http` server to `claude` writes or updates the selected group `.mcp.json` under `mcpServers`.
- [x] Applying preserves unrelated `.mcp.json` root fields and unrelated server ids.
- [x] Applying records `projectId`, target group path, `toolId`, `serverId`, `appliedServerId`, and applied time.
- [x] Disabling a managed Claude binding removes only the matching managed `mcpServers` entry from the selected group `.mcp.json`.
- [x] Disabling never removes a same-name local entry unless there is an applied ownership record for that group and target.
- [x] `${PROJECT_ROOT}` expands to the selected group path when rendering.
- [x] API and UI tests cover project group scoping, applying, preserving unrelated config, and disabling managed Claude entries.

## Blocked by

- .scratch/mcphub-mcp-management/issues/01-build-mcphub-center-library.md
