Status: ready-for-human

# Handle scope scripts and risk warnings

## Parent

.scratch/hookhub-hook-management/PRD.md

## What to build

Add the safety and ergonomics around real hook usage: shareable vs local-only scope, command preview, HTTP hook risk confirmation, env-var-name guidance, script path handling, duplicate warning, and explicit messaging that HookHub does not bypass tool-native trust or review flows.

## Acceptance criteria

- [ ] Structured create and apply flows distinguish shareable project config from local-only config where the target tool supports both.
- [ ] Command hooks show final command, target working directory, timeout, and required env names before saving.
- [ ] HTTP hooks require explicit confirmation before saving or applying.
- [ ] HookHub stores required environment variable names but never stores secret values.
- [ ] HookHub warns when a new hook appears to duplicate another hook in the same target config.
- [ ] HookHub shows that generated hooks may still require native trust/review in tools such as Codex.
- [ ] Script path inputs support project-relative paths and reject paths outside the selected project when the scope is shareable.
- [ ] Tests cover scope handling, secret boundary, HTTP confirmation, duplicate warnings, and trust messaging.

## Blocked by

- .scratch/hookhub-hook-management/issues/03-structured-create-project-hook.md
- .scratch/hookhub-hook-management/issues/05-apply-hookhub-template-to-project.md

