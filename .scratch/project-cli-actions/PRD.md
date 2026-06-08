Status: ready-for-human

# PRD: Project Group CLI 动作侧边栏

## Problem Statement

用户在项目详情页以 `Project Group` 为工作边界：Root Group 和 Subproject Group 各自代表一个真实工作目录。现有项目侧已经有 Skill、Agent、Plugin、MCP、Hook 等入口，用于把 Hub 中的能力作用到当前 group path。但一些功能 CLI 的核心价值不是安装本身，而是在当前工作目录执行项目级命令。例如 CodeGraph 需要在项目目录内运行 `codegraph init -i` 创建 `.codegraph/` 索引，后续还需要 `status`、`index`、`sync` 等命令维护该 Project Group 的本地索引。

顶层 `CliHub` 管理 CLI 的安装、发现和更新生命周期；它不应该直接变成项目配置面板，也不应该替代现有 Tool Adapter 或 Session Index。用户需要一个项目侧入口，能按当前 Project Group 展示功能 CLI 可用的受控命令，并以可见、可追踪的方式执行这些命令。

## Solution

在项目详情页的每个 Project Group 上新增 `CLI` 入口。点击后打开一个与项目技能、项目 MCP、项目 Hook 类似的侧边栏，名称为 `项目 CLI 管理`。侧边栏以当前 `targetRootPath` 为上下文，按 CLI 分组展示可用动作。

这个功能引入一个后端维护的 `Project CLI Action Registry`。Registry 只允许应用显式定义过的动作，不接受用户在项目侧输入任意 shell。每个动作记录所属 CLI、命令、参数、执行目录策略、是否写项目目录、是否需要确认、推荐执行方式、输出展示方式和可用性条件。前端只渲染 registry 返回的动作和按钮。

第一版通过 CliHub 自定义功能 CLI 验证 CodeGraph。CodeGraph 不进入 CliHub 内置 function CLI 清单，也不成为 `ToolId`。用户需要先在 CliHub 通过自定义 install command 或本地路径登记出 commandName 为 `codegraph` 的 CLI；Project CLI 面板只读取这个自定义 CLI 的发现状态和 commandName，不负责创建或更新 CliHub 记录。

登记并发现到 CodeGraph 自定义 CLI 后，项目侧优先支持：

- `初始化索引`：在当前 Project Group 路径运行 `codegraph init -i`。
- `查看状态`：在当前 Project Group 路径运行 `codegraph status`。
- `重建索引`：在当前 Project Group 路径运行 `codegraph index --force`。
- `增量同步`：在当前 Project Group 路径运行 `codegraph sync`。

`codegraph init -i`、`codegraph index --force`、`codegraph sync` 都会写当前 Project Group 的 `.codegraph/`，因此属于 Project Group 级 Writeback/Operation，必须清楚展示 cwd、命令、影响路径和运行结果。长耗时或高输出动作优先走可见终端；短状态命令可以后台执行并在侧边栏显示 stdout/stderr。所有命令的 cwd 必须固定为当前 `targetRootPath`，不能自动提升到顶层 Project，也不能跨 Subproject Group 执行。

`codegraph install` 不属于第一版 Project CLI 动作。它会写 agent MCP 配置和说明文件，更适合后续通过 McpHub/Apply 的 Preview、Binding、Managed File 模型处理。

## User Stories

1. As a local AI tool user, I want every Project Group to have a `CLI` entry, so that I can run project-scoped function CLI commands for that exact working directory.
2. As a local AI tool user, I want CLI actions grouped by CLI, so that I can distinguish CodeGraph actions from Playwright, gh, lark-cli, or other future tools.
3. As a local AI tool user, I want CodeGraph initialization to run in the selected Root Group or Subproject Group, so that `.codegraph/` is created in the intended directory.
4. As a local AI tool user, I want project CLI commands to show the exact cwd and command before execution, so that I understand what directory will be affected.
5. As a local AI tool user, I want writeback-like CLI actions to run in a visible terminal when appropriate, so that long output and progress are not hidden.
6. As a local AI tool user, I want short read-only commands such as `codegraph status` to show output in the side panel, so that I can inspect state without opening a separate terminal.
7. As a local AI tool user, I want unavailable CLIs to show install/discovery state from CliHub, so that missing prerequisites are visible without guessing.
8. As a local AI tool user, I want Project CLI actions to be predefined by the app, so that the project panel does not become an arbitrary command runner.
9. As a developer of the manager, I want Project CLI actions to stay separate from `ToolId`, Tool Adapter, Session Index, and Resume support, so that adding a function CLI does not imply project-tool support.
10. As a developer of the manager, I want Project CLI actions to reuse Project Group targetRootPath semantics, so that root and subproject behavior remains consistent with SkillHub, AgentHub, McpHub, HookHub, and PluginHub.

## Implementation Decisions

- Project CLI actions are project-side operations, not top-level CliHub lifecycle operations.
- Top-level CliHub remains responsible for CLI install, discovery, version, channel, and update state.
- Project CLI actions read CliHub availability for prerequisites but do not rewrite CliHub inventory.
- The project detail `CLI` button appears per Project Group, alongside existing Skill, Agent, Plugin, MCP, and Hook entries.
- The side panel is named `项目 CLI 管理`.
- The side panel groups actions by CLI display name.
- The first supported custom function CLI action group is `CodeGraph`.
- CodeGraph is not part of the built-in CliHub function CLI inventory in this feature.
- Project CLI actions appear only when CliHub already has a custom CLI record whose commandName is `codegraph`.
- Project CLI actions are defined by a backend registry; the UI must not accept arbitrary command text in MVP.
- Every action runs with cwd equal to the current Project Group `targetRootPath`.
- Every action records or displays the command, args, cwd, start time, exit code, stdout, stderr, and result status.
- Long-running or writeback-like actions should launch in a visible terminal.
- Read-only status actions may run through the backend and show output inline.
- Actions that write files must identify the expected managed or affected path, such as `<targetRootPath>/.codegraph/`.
- The MVP does not create a new `ToolId` for CodeGraph.
- The MVP does not add CodeGraph Session Index, Resume, or project-tool launch support.
- `codegraph install` is out of scope for this feature and should be handled through a future McpHub/Apply path.

## Testing Decisions

- API tests should cover listing Project CLI actions for root and subproject targetRootPath after registering a custom CodeGraph CLI.
- API tests should cover unavailable CLI state, available CLI state, and action execution result output.
- API tests should verify all project CLI actions run with cwd equal to the requested targetRootPath and reject paths outside the Project.
- Backend tests should cover CodeGraph action definitions, writeback metadata, read-only metadata, and terminal vs backend execution mode.
- UI tests should cover the Project Group `CLI` button, `项目 CLI 管理` side panel, grouped CodeGraph actions, unavailable state, command preview, and inline status output.
- UI tests should verify child Project Groups pass their own targetRootPath to action listing and execution.

## Out of Scope

- User-defined arbitrary project shell commands.
- Adding custom project-tool CLIs to project detail.
- New Tool Adapter, Session Index, or Resume support for CodeGraph.
- Global user-level CLI automation.
- Running `codegraph install` or editing agent MCP/instructions files.
- Automatic background indexing of every registered Project.
- Cross-project or cross-group batch execution.
- Full historical operation log beyond the most recent or currently visible run output.

## Further Notes

This feature should use the same product boundary as other project-side Hub panels: the top-level Hub owns reusable or lifecycle state, while the Project Group side panel owns explicit actions against one target root. For CodeGraph, the top-level CliHub can make `codegraph` available; the Project CLI panel can initialize and inspect `.codegraph/`; McpHub can later apply the `codegraph` MCP server to supported tools.

## Comments

- 2026-06-08：实现时确认 CodeGraph 作为自定义功能 CLI 验证 Project CLI 动作，不加入 CliHub 内置 function CLI 清单；命令名来自 CliHub 自定义 install command / local path 记录的解析结果。
- 2026-06-08：根据反馈补充边界：项目 CLI 面板动态展示 AI 项目管理系统 CliHub 中已安装的 `function` / `dependency` CLI 命令，例如 `gh`、`git`、`node`；这些命令展示不等于允许任意执行，只有 registry 显式定义的项目动作才显示执行按钮。
- 2026-06-08：项目 CLI 面板展示结构调整为第一层 `CLI` 名称，展开后显示该 CLI 的命令、用途描述、参数输入框和执行按钮；参数只解析为 argv 并传给 CliHub 已发现的命令，cwd 固定为当前 Project Group。
- 2026-06-08：项目 CLI 面板的“命令”改为常用命令模板：例如 `Git` 下显示“初始化仓库”“查看状态”等中文动作，后端 registry 负责维护模板、默认参数和描述，前端只允许追加附加参数，不要求用户记住子命令。
