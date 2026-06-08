## Project purpose

本项目是一个本地 AI 项目与会话管理器：用本地 Web UI 和 Node/TypeScript 后端管理用户登记的本机 Project、Project Group、AI Tool 会话索引，以及可复用能力的顶层 Hub。它不是通用文件管理器，也不是远程 SaaS；默认工作对象是本机目录、本机 CLI、本地 SQLite 数据和受控的项目文件写回。

核心目标是把多个 AI coding 工具的本地工作流统一起来：扫描和展示各 Tool 的 Session Index，按 Project / Root Group / Subproject Group 组织历史会话和新会话入口，并通过 SkillHub、AgentHub、McpHub、HookHub、PluginHub、CliHub 等 Hub 管理可复用资源、工具能力和项目侧启用状态。

## Core product model

- `Project` 是用户登记的本地工作目录；`Project Group` 是项目详情页里的操作边界，包括 Root Group 和 Subproject Group。Subproject Group 不是新的顶层 Project。
- `Tool` 是 Codex、Claude、OpenCode、Qwen、Cursor 等本机 AI CLI 或编码工具。工具是否出现在项目 UI 中，应由 adapter 能力、项目启用状态和本机 availability 共同决定，不能在单个界面硬编码。
- `Session Index` 是只读索引视图，用于展示、搜索和 resume 判断；应用不拥有原始 Tool 会话历史，也不应在没有明确 writeback 流程时改写它。
- `Hub` 是顶层资源中心，负责管理可复用资源或工具能力；`Center Library` 是 Hub 在应用数据目录中拥有的真实资源库。
- 项目侧只接收 Hub 通过 Apply、Sync、Disable、Migration 等动作作用到具体 `Project Target` 的结果。项目侧状态应由 `Binding`、`Managed File`、ownership 和 drift/conflict 检测解释，而不是靠 UI 临时推断。
- 所有写回项目或 Tool 原生文件的动作都必须尊重 Preview、Impact、Backup、Conflict、Drift、Unmanaged File 这些边界；不能把 refresh、indexing 或普通 config save 伪装成 writeback。
- `.scratch/<feature>/PRD.md` 和对应 issue 是功能实施合同；`CONTEXT.md` 是领域术语合同。实现前先对齐这些合同，再改代码。

## Hub principles

Hub 的职责是管理可复用资源的导入、中心库归档、解析、GitHub 来源更新和跨 Tool 适配；项目的职责是根据自己的 Project Group、启用 Tool、可用能力和本地文件状态，把 Hub 中的内容显式应用到项目侧目标。

- Hub 至少要提供三类能力：
  - 导入：支持从 GitHub 或本地目录/文件导入资源，并把外部内容物化到自己的 `Center Library`。
  - 适配：支持导入某一种 Tool 的原生格式后，解析为应用可理解的资源记录，再通过 adapter 自动适配到多个 Tool 的目标格式和目标路径；不支持的 Tool 必须显式标注为不可用或不可转换。
  - 管理：提供查看、搜索、打开、删除、影响预览等管理操作；对 GitHub 导入来源提供更新操作，让用户能理解中心库里有什么、来自哪里、会影响哪些项目。
- Hub 先把外部或内置资源导入到自己的 `Center Library`，形成应用可理解、可检索的资源记录。导入来源可以是本地目录、GitHub 仓库、内置包或用户创建内容；本地目录/文件和内置包按导入时快照管理，不跟踪原路径变化，内容变化应通过重新导入完成；GitHub 导入来源可以通过更新动作刷新中心库。
- Hub 负责理解资源语义和 Tool 差异。不同 Tool 的目标路径、原生格式、渲染规则、启用方式和支持边界应封装在 adapter/service 中，不散落在 UI 或项目面板里。
- Hub 中的资源不应因为存在于中心库就自动进入项目。项目侧必须通过 Apply、Sync、Disable、Migration 等明确动作，把资源作用到某个 `Project Target`。
- 项目侧应用必须按当前 Project Group 和 Tool 状态计算可操作目标：只展示当前项目启用、当前机器可用、后端 adapter 支持的目标；不能把全局 Hub 能力当成每个项目都可直接使用。
- 应用到项目时要记录 `Binding`、`Managed File`、owner、目标路径、上次生成内容或等价校验信息，使后续 Sync、Disable、Drift 检测、Conflict 处理和卸载/删除影响预览有真实依据。
- Hub 资源和项目本地文件是不同层级。Hub 管理中心库资源；项目面板管理当前项目如何使用这些资源。不要把项目里的生成文件、link、配置项或 unmanaged file 误当成 Hub 的真实来源。
- 单类资源优先由对应 Hub 管理，例如 skill、agent、MCP、hook、CLI；组合型资源可以引用多个 Hub 的资源，但不应复制或篡改这些资源的来源身份。组合层负责组合关系和项目应用编排，组件 Hub 继续负责组件本身。
- 任何项目写回都要有 Preview/Impact、冲突处理和必要的备份保护。刷新 Hub、扫描本地状态、更新中心库索引不等于写回项目。

## Agent skills

### Issue tracker

本仓库的 Issues 和 PRD 使用 `.scratch/` 下的本地 Markdown 文件管理。详见 `docs/agents/issue-tracker.md`。

### Triage labels

使用默认的五个分诊状态标识：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### Domain docs

本仓库按 single-context 配置。相关技能在这些文件存在时，应优先查看根目录的 `CONTEXT.md` 和 `docs/adr/`。详见 `docs/agents/domain.md`。

### Output language

生成文档时，描述性内容默认使用中文；代码标识、路径、命令、状态名和其他需要精确保留的技术标识维持原文。

### UI implementation guidelines

实现或调整 UI 前，先调研本项目已经完成并被测试覆盖的界面形态，包括 `src/client/*Views.tsx`、`src/client/main.tsx`、`src/client/styles.css`、`tests/ui.test.tsx`，以及对应 `.scratch/<feature>/PRD.md` 和 issue 文件。通用 UI 模式详见 `docs/ui-patterns.md`；若某个新界面沉淀出可复用模式，应把模式和取舍记录到对应 PRD/issue；跨功能通用的约定再补充到 `docs/ui-patterns.md`、`CONTEXT.md`、`docs/adr/` 或本文件。

能复用现有模块、组件、交互和 API 形态时优先复用，不为同一语义重复造轮子。Hub 类界面优先参考已稳定的 SkillHub、AgentHub、McpHub、HookHub、PluginHub、CliHub 模式，例如顶栏入口、中心库列表、来源分组、搜索/导入分区、`details/summary` 行、项目侧标签页、行内操作、Preview/Impact 确认、底部全局 toast、cached-first 加后台刷新等。

保持结构和操作方法一致。类似功能应使用一致的入口位置、按钮层级、状态展示、确认流程、反馈位置和测试断言；如果业务语义要求差异化，必须在 PRD/issue 或 ADR 中说明原因。不要只在单个模块里临时硬编码另一套列表、状态、文案或交互路径。
