Status: ready-for-human

# PRD: HookHub 原生 Hook 配置与复用中心

## Problem Statement

用户在本机同时使用 Claude Code、Codex、OpenCode、Qwen、Qoder、Copilot 等多个 AI coding 工具。这些工具的 hook 和 MCP 不同：MCP 是可抽象成中心 server 定义后分发到项目的外部能力；hook 则是每个工具原生提供的生命周期配置能力，事件、matcher、handler 类型、输出控制、信任模型和配置文件位置都不同。

如果 HookHub 按 McpHub 的方式只保存中心定义再向项目分发，会削弱 hook 的原生语义，也会让用户很难直接在项目上下文里创建一个能立即生效的 hook。用户真正需要的是便捷地配置项目 hook、看懂当前项目真实启用的 hook、把项目里调好的 hook 同步到 HookHub 供复用，并能从 HookHub 把模板应用到其它项目。

项目当前已经有顶层 `SkillHub`、`McpHub` 入口，以及项目详情中按 root/subproject group 打开的侧边管理面板。HookHub 需要沿用这个项目/子项目语义，但产品心智必须调整：项目侧是 hook 创作和原生配置的第一入口，顶层 HookHub 是复用库，而不是唯一源头。

## Solution

新增 `HookHub`。顶层 `HookHub` 是可复用 hook 模板库，管理 hook 模板、适用工具、事件、matcher、handler 定义、风险提示、变量占位符和更新时间。HookHub 内可以结构化创建和编辑中心模板，也可以从中心模板分发到指定项目 group；但中心模板不等于某个项目当前启用状态。

项目详情中的每个 root/subproject group 新增 `Hooks` 入口。点击后打开项目 Hook 管理面板，面板包含三个 tab：

- `本地 Hooks`：结构化读取当前 group path 下真实存在的工具原生 hook 配置，展示 managed 和 unmanaged hook。
- `新建 Hook`：在当前项目上下文中结构化创建工具原生 hook，选择工具、配置作用域、事件、matcher、handler 类型、命令或 HTTP endpoint、脚本路径、timeout、环境变量名和风险说明，并写入对应工具的原生项目配置文件。
- `HookHub Hooks`：展示中心模板库，允许把模板应用到当前 group path，也允许把当前项目中已调好的本地 hook 同步为 HookHub 模板。

HookHub 需要双入口，而不是在“项目侧配置”和“HookHub 内配置”之间二选一：

- HookHub 内配置中心定义：适合沉淀已经稳定的复用模板，配置默认事件、matcher、handler、变量、风险提示和适用工具，并从中心页选择一个或多个项目 group 分发。
- 项目侧配置本地实例：适合在具体项目里快速创建、调试、覆盖变量、选择 local/shareable scope，并在跑通后同步到 HookHub。

中心定义分发时也必须落到项目 group 的工具原生配置文件。分发不是后台全局同步，而是用户显式选择目标项目、目标 group、目标工具和 scope 后执行的一次写入。每次分发都记录 binding ownership，并显示目标配置路径和渲染预览。

HookHub 不强行把所有工具压成一个完全统一的 hook 格式。中心库保存“公共元数据 + 目标工具原生配置片段”的组合模型：

- 公共元数据用于搜索、展示、风险提示和复用，例如 `hookId`、名称、描述、适用场景、风险等级、变量名、支持工具、更新时间。
- 工具原生配置片段用于渲染，例如 Claude/Codex/Qwen/Qoder 的 event、matcher、handler fields，OpenCode 的 plugin 文件信息，Copilot 的 `.github/hooks/*.json` entry。
- 只有明确同构的字段才提升为公共字段，例如 event、matcher、handler type、command、timeout、enabled、scope；不同工具独有能力保留在 per-tool payload 中。

项目侧新建 hook 是 MVP 的核心能力。用户可以从项目面板选择工具和事件，通过结构化表单创建 hook，HookHub 后端按工具 renderer 写入对应配置文件。写入必须是结构化编辑：解析已有 JSON/JSONC/TOML，插入或更新指定 hook entry，保留 unrelated 配置；不承诺字节级格式保留。

项目侧同步到 HookHub 是第二条核心能力。用户可以在 `本地 Hooks` 里选择一个 unmanaged 或 managed hook，将其保存为 HookHub 模板。同步时后端读取原生配置片段，抽取公共元数据，保留目标工具 payload，并要求用户填写模板名称、描述和变量说明。同步不会改变当前项目文件，只会创建或更新 HookHub 中心模板。

HookHub 必须记录自己写入或接管过的项目 hook。binding 记录至少包含 `projectId`、`targetRootPath`、`toolId`、`hookId`、`configPath`、`scope`、`managedEntryKey`、`appliedAt` 和 `source`。禁用、删除模板或清理绑定时，只删除或修改有接管记录的 entry；本地 unmanaged hook 只展示和允许同步，不会被 HookHub 误删。

MVP 优先支持项目级 Claude Code、Codex、Qwen、Qoder hook 配置：

- `claude`：写 `<groupPath>/.claude/settings.json` 或 `<groupPath>/.claude/settings.local.json` 的 `hooks`。
- `codex`：优先写 `<groupPath>/.codex/hooks.json`；如未来需要 inline `[hooks]`，作为独立后续范围。
- `qwen`：写 `<groupPath>/.qwen/settings.json` 或 `<groupPath>/.qwen/settings.local.json` 的 `hooks`。
- `qoder`：写 `<groupPath>/.qoder/settings.json` 或 `<groupPath>/.qoder/settings.local.json` 的 `hooks`。

`opencode` 和 `copilot` 放在后续适配：OpenCode hook 本质是 JS/TS plugin 文件和 `opencode.json` plugin 列表，不能简单当作 JSON hook entry；Copilot 同时有 CLI、repo hook file 和 cloud agent sandbox 差异，需要单独展示执行环境限制。HookHub 可以先把它们显示为“暂不支持结构化新建”，避免错误写入。

HookHub 不保存真实 secret，不写系统或用户级环境变量。结构化表单只记录需要的环境变量名和变量引用。HTTP hooks 默认要求用户显式确认风险；命令 hooks 显示最终命令预览、工作目录、timeout 和作用域。HookHub 不负责绕过 Codex、Claude 或其它工具自身的 hook trust/review 流程，只负责生成正确的项目配置。

## User Stories

1. As a local AI tool user, I want a top-level `HookHub` entry, so that I can manage reusable hook templates from one place.
2. As a local AI tool user, I want project groups to have a `Hooks` entry, so that I can configure hooks for the exact root/subproject directory where the tool will run.
3. As a local AI tool user, I want HookHub to treat hooks as native tool configuration, so that tool-specific event and output semantics are preserved.
4. As a local AI tool user, I want the project Hook panel to show local native hooks, so that I understand what the selected directory already enables.
5. As a local AI tool user, I want unmanaged local hooks to be visible but not automatically controlled, so that HookHub does not accidentally delete hand-written config.
6. As a local AI tool user, I want to create a new hook from the project panel, so that I can configure automation where I am already working.
7. As a local AI tool user, I want new hook creation to be structured, so that I do not need to remember every tool's JSON shape.
8. As a local AI tool user, I want to choose the target tool when creating a hook, so that only valid events and handler fields are shown.
9. As a local AI tool user, I want to choose the config scope, so that I can decide whether a hook is shareable project config or local-only config.
10. As a local AI tool user, I want to configure event and matcher fields through controlled inputs, so that invalid event names and matcher placement are avoided.
11. As a local AI tool user, I want to configure command hooks with command, timeout, env names, and status text, so that common workflows can be created quickly.
12. As a local AI tool user, I want HTTP hooks to require explicit risk confirmation, so that I do not accidentally exfiltrate hook payloads.
13. As a local AI tool user, I want to preview the target config path and rendered entry, so that I understand what file will change.
14. As a local AI tool user, I want applying a project hook to preserve unrelated settings, so that existing tool configuration remains intact.
15. As a local AI tool user, I want HookHub to record managed ownership, so that disabling a hook only removes entries it created or adopted.
16. As a local AI tool user, I want to disable a managed project hook, so that I can stop a hook without manually editing config files.
17. As a local AI tool user, I want disabling unmanaged hooks to be unavailable in MVP, so that HookHub does not become a general destructive config editor.
18. As a local AI tool user, I want to sync a local project hook to HookHub, so that a hook I tuned in one project can be reused elsewhere.
19. As a local AI tool user, I want sync-to-HookHub to keep the current project file unchanged, so that saving a reusable template is non-destructive.
20. As a local AI tool user, I want to add a name, description, variables, and risk notes when syncing, so that the center template is understandable later.
21. As a local AI tool user, I want HookHub templates to preserve tool-native payloads, so that applying a template does not lose tool-specific behavior.
22. As a local AI tool user, I want to create and edit reusable templates inside HookHub, so that stable hooks can be prepared before choosing a project.
23. As a local AI tool user, I want to distribute a HookHub template from the center page to selected project groups, so that common hook setups can be rolled out without opening each project first.
24. As a local AI tool user, I want to apply a HookHub template from a project group, so that common hook setups can also be reused from the current project context.
25. As a local AI tool user, I want applying a template to show unsupported targets clearly, so that I do not assume a hook works on tools HookHub cannot render.
26. As a local AI tool user, I want templates to support variables like `${PROJECT_ROOT}`, so that the same hook can work across directories.
27. As a local AI tool user, I want environment variable names to be shown without storing secret values, so that I can configure secrets outside the app.
28. As a local AI tool user, I want Claude project hooks to write `.claude/settings.json` or `.claude/settings.local.json`, so that Claude Code reads them through its native settings layer.
29. As a local AI tool user, I want Codex project hooks to write `.codex/hooks.json`, so that Codex reads them through its native hook discovery.
30. As a local AI tool user, I want Qwen project hooks to write `.qwen/settings.json` or `.qwen/settings.local.json`, so that Qwen Code reads them through native settings.
31. As a local AI tool user, I want Qoder project hooks to write `.qoder/settings.json` or `.qoder/settings.local.json`, so that Qoder reads them through native settings.
32. As a local AI tool user, I want HookHub to show that OpenCode uses plugin files, so that I do not confuse it with JSON hook settings.
33. As a local AI tool user, I want HookHub to show Copilot cloud agent limitations, so that repo hooks are not mistaken for local CLI hooks.
34. As a local AI tool user, I want hook templates to be searchable by tool, event, matcher, handler type, and description, so that I can find useful automations quickly.
35. As a local AI tool user, I want duplicated same-purpose hooks to be detectable in a project, so that I do not accidentally run two formatters or two blockers.
36. As a local AI tool user, I want invalid local hook config to be shown with a parse error, so that I can fix the native config file manually if needed.
37. As a local AI tool user, I want HookHub to respect each tool's trust/review model, so that generated config does not pretend to be already trusted.
38. As a developer of the manager, I want HookHub adapters per tool, so that target-specific config differences do not leak into the UI.
39. As a developer of the manager, I want HookHub storage to separate reusable templates from project bindings, so that project state and library state do not collapse into one table.
40. As a developer of the manager, I want tests around rendered config, discovery, sync-to-library, center distribution, and disable cleanup, so that the feature is verified through user-visible behavior.

## Implementation Decisions

- HookHub is app-owned and does not depend on an external hook manager as runtime.
- HookHub is not a hook execution engine; it manages native tool configuration files.
- Top-level `HookHub` manages reusable templates and explicit center-to-project distribution.
- HookHub center configuration is the right surface for stable reusable definitions.
- Project-side configuration is the right surface for local instantiation, debugging, scope overrides, and sync-back to the center library.
- Center-to-project distribution still writes native project config through the same project group renderer and binding ownership path.
- Center-to-project distribution is explicit and user-triggered, not background global sync.
- Project-level hook management lives on each existing root/subproject project detail group and uses that group's full path as the target root.
- The project Hook panel has three tabs: `本地 Hooks`、`新建 Hook`、`HookHub Hooks`.
- Project-side structured hook creation is first-class, not a secondary import-only flow.
- Syncing a project hook to HookHub is first-class and non-destructive.
- The center library stores common metadata plus per-tool native payloads.
- The center library does not force all hooks into one lossy normalized schema.
- Shared fields such as event, matcher, handler type, command, timeout, scope, and variable names are normalized only when the target tool supports them clearly.
- Tool-specific fields remain in per-tool payloads.
- MVP supports structured project config for `claude`, `codex`, `qwen`, and `qoder`.
- `opencode` is out of structured MVP because hooks are plugin files rather than ordinary JSON entries.
- `copilot` is out of structured MVP because CLI and cloud agent hook behavior differ enough to require a dedicated adapter.
- Claude project hooks write `.claude/settings.json` or `.claude/settings.local.json`.
- Codex project hooks write `.codex/hooks.json` in MVP.
- Qwen project hooks write `.qwen/settings.json` or `.qwen/settings.local.json`.
- Qoder project hooks write `.qoder/settings.json` or `.qoder/settings.local.json`.
- File writes are structure-aware and preserve unrelated root settings and unrelated hook entries.
- The app does not promise byte-for-byte formatting preservation.
- Project bindings record managed ownership for every applied or adopted hook entry.
- Disabling or deleting managed hooks only touches entries with ownership records.
- Unmanaged local hooks can be synced to HookHub, but cannot be deleted by HookHub in MVP.
- Sync-to-HookHub creates or updates a center template without modifying the source project file.
- Applying a HookHub template writes native project config and records binding ownership.
- Templates may include variables such as `${PROJECT_ROOT}` and required environment variable names.
- HookHub does not store secret values and does not write system/user environment variables.
- HTTP hook creation requires explicit risk confirmation.
- Generated config must not bypass tool-native trust, review, or trusted-folder mechanisms.

## Testing Decisions

- Tests should verify external behavior at storage, API, renderer, discovery, and UI seams rather than internal implementation details.
- Storage tests should cover HookHub templates, per-tool payloads, project hook bindings, ownership cleanup, and sync provenance.
- Renderer tests should cover Claude, Codex, Qwen, and Qoder config writes while preserving unrelated settings.
- Discovery tests should cover managed and unmanaged local hooks, parse failures, config scopes, and invalid event/matcher placement.
- API tests should cover listing HookHub, listing project hooks, structured project hook creation, sync-to-HookHub, applying a template, disabling a managed hook, and preserving unmanaged hooks.
- UI tests should cover top-level HookHub navigation, center template creation/editing, center-to-project distribution, project group `Hooks` button visibility, local hook display, structured create form, sync action, template application, and risk warnings.
- File write tests should use temporary project directories so no real hook configuration is mutated.
- Similar test seams already exist for SkillHub and McpHub: center list APIs, project-side panel APIs, config renderers, and UI smoke tests should be reused where possible.

## Out of Scope

- Running hook scripts from inside this app.
- Validating that an external tool has trusted or accepted a generated hook.
- User-level or system-level hook configuration.
- Managed enterprise/policy hook configuration.
- Secret vault or encrypted secret storage.
- Writing system, user, shell, IDE, or tool-launch environment variables.
- Full diff preview before applying.
- Byte-for-byte JSON/JSONC/TOML formatting preservation.
- Deleting unmanaged local hooks.
- Automatically enabling hooks across every project without explicit target selection.
- Background sync from project hooks into HookHub.
- Background sync from HookHub into projects.
- OpenCode structured hook/plugin authoring in MVP.
- Copilot CLI/cloud hook rendering in MVP.
- Gemini CLI support, because it is not currently part of this repository's `ToolId`.

## Further Notes

HookHub should reuse the existing Hub product pattern only at the navigation and ownership level: a top-level center library plus project-context panels. The data model must differ from McpHub because hook behavior is native to each tool. The project panel is the best surface for local creation and tuning; the center library is the best surface for stable template authoring and explicit distribution.
