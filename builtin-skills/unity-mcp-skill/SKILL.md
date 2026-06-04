---
name: unity-mcp-skill
description: Use when working on Unity projects through a local Unity MCP bridge, including scene inspection, editor automation, asset/script changes, play-mode checks, and Unity-specific debugging.
---

# unity-mcp-skill

Use this skill when the task involves a Unity project and the local `unityMCP` server is available.

## Workflow

1. Confirm the current workspace is a Unity project by checking for `Assets/`, `ProjectSettings/`, and `Packages/manifest.json`.
2. Prefer Unity MCP reads for runtime/editor state instead of guessing from files alone.
3. Use Unity MCP write actions only after identifying the exact scene, asset, script, or editor object being changed.
4. After edits, verify through Unity editor state, play-mode checks, or the project's existing Unity test command.

## Local MCP

The expected local MCP server is `unityMCP` at `http://127.0.0.1:8082/mcp`.

If the server is unavailable, fall back to file-level inspection and state clearly that Unity editor verification was not run.
