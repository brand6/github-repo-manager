Status: ready-for-human

# Build McpHub center library

## Parent

.scratch/mcphub-mcp-management/PRD.md

## What to build

Build the top-level `McpHub` center library for normalized MCP server definitions. This slice should let the user open `McpHub`, see the center server list with built-in MCP already active, view normalized JSON, delete user-imported servers, and rely on stable immutable `serverId` values.

This issue establishes the center-library source of truth only. It should not write any project MCP files.

## Acceptance criteria

- [x] A top-level `McpHub` entry is available next to the existing global hub/navigation entries.
- [x] The McpHub page lists center MCP servers with `serverId`, transport, summary fields, required env names, and updated time.
- [x] The app persists normalized MCP server definitions in its local database.
- [x] `serverId` is globally unique and cannot be renamed after creation.
- [x] Built-in MCP servers for `context7`, `playwright`, and `unityMCP` are automatically present in the center library.
- [x] McpHub does not expose a separate built-in add flow or an "added to Hub but not enabled" center-library state for built-in MCP.
- [x] Deleting a user-imported center server removes it from the center library without touching project files in this slice.
- [x] API and UI tests cover listing built-in MCP, JSON import, deletion, and immutable `serverId` behavior.

## Blocked by

None - can start immediately
