Status: ready-for-human

# Seed built-in agency-agents

## Parent

.scratch/agenthub-agent-management/PRD.md

## What to build

Add the built-in `agency-agents` source. On first AgentHub use, the app should lazily import the packaged `msitarzewski/agency-agents` snapshot into the app-owned AgentHub library, parse it as Claude/Markdown truth, and show the imported agents grouped under a normal source.

This slice should use the built-in repository structure documented by `agency-agents`. It must not call that repository's `convert.sh`, `install.sh`, or any shell script.

## Acceptance criteria

- [x] A packaged `agency-agents` snapshot is available under an explicit built-in resource folder.
- [x] AgentHub lazily seeds `agency-agents` on AgentHub/project-Agent entry points instead of app startup.
- [x] The built-in source is recorded as ordinary AgentHub source data and can be deleted.
- [x] Deleted built-in `agency-agents` can be explicitly re-imported from the packaged snapshot.
- [x] The built-in source parser imports only valid agent Markdown files from the documented agent locations and skips README, examples, integrations, scripts, and ordinary documentation.
- [x] Imported `agency-agents` records use Claude/Markdown as `sourceTruthTool` and subagent-compatible truth role.
- [x] Imported records preserve `sourceRelativePath` and category labels such as engineering, design, marketing, and testing.
- [x] Duplicate lazy seeding is idempotent and does not create duplicate agents or sources.
- [x] Tests cover lazy seed, category parsing, source grouping, deletion, re-import, skipped files, and idempotency.

## Blocked by

- .scratch/agenthub-agent-management/issues/01-build-agenthub-center-library.md

