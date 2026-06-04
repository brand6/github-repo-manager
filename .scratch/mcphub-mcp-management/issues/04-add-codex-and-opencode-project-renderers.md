Status: ready-for-human

# Add Codex and OpenCode project renderers

## Parent

.scratch/mcphub-mcp-management/PRD.md

## What to build

Extend project-side McpHub application from the Claude tracer bullet to Codex and OpenCode. The user should be able to apply or disable the same center MCP server for `codex` and `opencode` on the selected project root/subproject group.

This slice should keep target-specific format conversion inside renderer code and preserve unrelated project config fields.

## Acceptance criteria

- [x] `McpHub MCP` shows supported `codex` and `opencode` targets for project groups.
- [x] Applying to `codex` writes or updates the selected group `.codex/config.toml` under `mcp_servers`.
- [x] Codex rendering supports `stdio` command/args/env-style variable forwarding and `http` url/header-compatible fields in the MVP model.
- [x] Codex rendering preserves unrelated TOML settings where possible.
- [x] Applying to `opencode` writes or updates the selected group `opencode.json` under `mcp`.
- [x] OpenCode rendering converts `stdio` to `local`, command plus args to command array, and env to `environment`.
- [x] OpenCode rendering converts `http` to `remote`.
- [x] OpenCode rendering preserves unrelated root fields such as providers, plugins, and schema metadata.
- [x] Disabling managed `codex` or `opencode` bindings removes only the matching managed entry from the selected target file.
- [x] Tests cover Codex and OpenCode apply/disable behavior, conversion output, unrelated config preservation, and group path scoping.

## Blocked by

- .scratch/mcphub-mcp-management/issues/03-apply-mcphub-mcp-to-claude-project-config.md
