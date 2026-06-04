Status: ready-for-human

# Import JSON into McpHub

## Parent

.scratch/mcphub-mcp-management/PRD.md

## What to build

Build JSON-only MCP import/edit for the McpHub center library. The user should be able to paste one or many MCP server snippets from common tool formats and have McpHub extract normalized core definitions rather than preserving the original source format.

The import result should explain what was added, updated, patched, skipped, or failed.

## Acceptance criteria

- [x] The McpHub page has a JSON import/edit flow without a structured field form.
- [x] Import supports `mcpServers`, `servers`, `mcp`, plain server maps, and single server objects with an explicit server id.
- [x] Import normalizes `stdio` and `http` entries into the center model.
- [x] Import converts OpenCode `local` entries to `stdio` and OpenCode `remote` entries to `http`.
- [x] Import supports multiple servers in one paste.
- [x] Import tolerates Markdown code fences, surrounding prose, comments, trailing commas, and small bracket imbalance when repair produces one clear parse result.
- [x] Same-id complete imports update the existing center server.
- [x] Same-id incomplete imports patch only provided known fields without erasing missing existing fields.
- [x] Incomplete imports without an existing center server fail with a clear missing-field reason.
- [x] Unsupported transport such as `sse` fails clearly in MVP.
- [x] Tests cover successful multi-import, repaired paste input, complete update, patch update, incomplete failure, and unsupported transport failure.

## Blocked by

- .scratch/mcphub-mcp-management/issues/01-build-mcphub-center-library.md
