Status: ready-for-human

# Clean managed MCP on disable and delete

## Parent

.scratch/mcphub-mcp-management/PRD.md

## What to build

Complete the managed ownership lifecycle. McpHub should remove project MCP entries only when it has recorded that it applied or migrated those entries, and it should leave unmanaged local MCP untouched.

This slice covers disabling bindings from project panels and deleting center servers that have managed project entries.

## Acceptance criteria

- [x] Disabling a selected server/target from `McpHub MCP` deletes only that server id from the selected group target file when an applied ownership record exists.
- [x] Disabling removes the matching project binding and applied ownership record.
- [x] Disabling a binding whose file entry is already missing succeeds with a clear no-op result.
- [x] Deleting a center server removes its center-library record and project bindings.
- [x] Deleting a center server cleans project target files only for entries with applied ownership records.
- [x] Deleting a center server does not remove unmanaged local entries with the same id when no ownership record exists.
- [x] Cleanup reports modified files, skipped missing files, and failures.
- [x] Tests cover managed disable, missing-file no-op, center delete cleanup, unmanaged same-id preservation, and failure reporting.

## Blocked by

- .scratch/mcphub-mcp-management/issues/04-add-codex-and-opencode-project-renderers.md
- .scratch/mcphub-mcp-management/issues/06-migrate-local-mcp-into-mcphub.md
