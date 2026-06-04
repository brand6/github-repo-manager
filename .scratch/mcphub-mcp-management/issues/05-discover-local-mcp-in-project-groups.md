Status: ready-for-human

# Discover local MCP in project groups

## Parent

.scratch/mcphub-mcp-management/PRD.md

## What to build

Build the `本地 MCP` tab for a selected project root/subproject group. The tab should read the group's existing Claude, Codex, and OpenCode MCP config files, normalize discovered entries, and show them as local entries without editing or deleting them.

This issue is discovery-only. Migration into McpHub is covered by a later slice.

## Acceptance criteria

- [x] `本地 MCP` reads `.mcp.json` for Claude-style `mcpServers`.
- [x] `本地 MCP` reads `.codex/config.toml` for Codex `mcp_servers`.
- [x] `本地 MCP` reads `opencode.json` for OpenCode `mcp`.
- [x] Discovered entries are normalized to the center model for comparison and display.
- [x] Entries with applied ownership records are marked as McpHub-managed.
- [x] Entries without applied ownership records are shown as local unmanaged MCP.
- [x] The tab is read-only for local unmanaged entries in MVP.
- [x] Invalid or unsupported local entries are shown with a readable reason instead of crashing the panel.
- [x] API and UI tests cover discovery for all three target files, managed/unmanaged classification, invalid entry display, and selected group path scoping.

## Blocked by

- .scratch/mcphub-mcp-management/issues/03-apply-mcphub-mcp-to-claude-project-config.md
- .scratch/mcphub-mcp-management/issues/04-add-codex-and-opencode-project-renderers.md
