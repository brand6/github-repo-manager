Status: ready-for-human

# Handle required env and rendered variable references

## Parent

.scratch/mcphub-mcp-management/PRD.md

## What to build

Add the MVP secret boundary for McpHub. Users should be able to record required environment variable names and variable references in center server definitions, see warnings when the app process cannot observe those variables, and render target-specific config without storing or expanding real secret values.

This slice should make the security behavior explicit while preserving the user's ability to configure env outside the app.

## Acceptance criteria

- [x] Center server definitions can store `requiredEnv` variable names.
- [x] Center server definitions can store env values as variable references without storing real secret values by default.
- [x] McpHub shows required env names on the center library page.
- [x] Project apply surfaces warnings for required env names missing from the app process environment.
- [x] Missing required env warnings do not block applying the MCP server.
- [x] Claude rendering preserves variable references in `.mcp.json`.
- [x] Codex rendering uses variable forwarding where possible rather than writing secret values.
- [x] OpenCode rendering uses env reference syntax where possible rather than writing secret values.
- [x] `${PROJECT_ROOT}` expansion remains separate from secret/env references and expands only to the selected group path.
- [x] Tests cover required env display, missing-env warnings, non-blocking apply, target-specific env rendering, and `${PROJECT_ROOT}` expansion.

## Blocked by

- .scratch/mcphub-mcp-management/issues/03-apply-mcphub-mcp-to-claude-project-config.md
- .scratch/mcphub-mcp-management/issues/04-add-codex-and-opencode-project-renderers.md
