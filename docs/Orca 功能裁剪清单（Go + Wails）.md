# Orca 功能裁剪清单（Go + Wails）

> 创建日期：2026-10-21。用途：由项目负责人决定功能保留范围，随后再形成 Go + Wails 重构方案。

## 已确认目标与未决边界

- 已确认：移除 Electron；采用 Go + Wails；允许删减功能。
- 已确定的功能裁剪见各表“决定”及文末选择结果；旧版数据和旧版远程/移动协议无需兼容，内嵌浏览器有条件保留（技术不可行时允许移除），不接入第三方云服务。
- 已确认：最初未指定的 A–W 条目全部保留；本轮继续移除远程、跨主机、公开分享及本地 Docker 等关联能力，当前 217 项保留、135 项删除。
- 已确认：目标 Windows 10 及以上（x64）；Windows 10 的具体最低版本号待技术验证锁定；前端能复用就复用，保留功能界面与原有保持一致；退出策略保持一致，具体行为待旧版取证；分发暂定本地打包。
- 后台由 Go 承担；是否仍需附带 Node 运行时由依赖评估决定，不由用户预先指定。整个语音模块、反馈上传、遥测和自动更新本轮先移除；崩溃资料本地导出保留。
- 本文不把此前提出的“先保留 Node 后台”视为已确认决定；裁剪范围以本表已记录的选择为准。
- Wails 使用 Web 前端；“后台采用 Go”与“前端是否复用 React/TypeScript”是两个独立选择。

## 如何选择

每行“决定”可填写：**保留 / 删除 / 后续再做 / 待定**。当前 A–W 功能条目已全部设为“保留”或“删除”；平台等非二元实现选择仍可为“待定”。需要保留部分能力时，在备注中写清楚边界。

可以直接修改表格，也可以用编号回复，例如：`保留 A01、C01–C10；删除 K 全组；L 只保留 SSH，不保留 WSL`。整组删除后，如有依赖冲突，再统一核对。

## 清单口径

- 基于仓库固定提交 `e2196403c397b44964f6ec80b93a3cfee27aa0df`，并交叉核对产品文档、preload API、界面模块与后台源码。
- 这是按用户可裁剪能力整理的完整范围盘点，包含桌面、远程、移动端、云配套及实验性模块；不是逐个按钮、快捷键、配置字段或内部 RPC 的穷举。
- 文档或源码存在不等同于所有平台均已验证可用；本次没有启动应用逐项验收。实验性功能已在相应条目标明，源码级功能需在确定保留后进一步验证。
- 各组附固定提交的证据入口。文档和实现若有偏差，以后续验收确定最终行为。
- V 组是底层能力，不宜脱离上层保留功能单独裁剪；它们仍列出，以免把迁移成本遗漏。

## 分组总览

| 分组  | 功能域              | 条目数 | 整组决定 |
| --- | ---------------- | --: | ---- |
| A | 项目、仓库与工作区 | 20 | 保留 |
| B | 窗口、布局与导航 | 12 | 保留 |
| C | 终端基础交互 | 20 | 删除 C17，其余保留 |
| D | Agent 启动、控制与状态 | 15 | 删除 D02，其余保留 |
| E | 聊天界面与历史会话 | 15 | 保留 |
| F | 账号、用量与凭据 | 12 | 删除 F01–F11；保留 F12 |
| G | 文件浏览、代码编辑与搜索 | 12 | 保留 |
| H | 文档编辑、预览与产物 | 13 | 删除 H11–H13，其余保留 |
| I | Git 与源码审阅 | 17 | 保留 |
| J | 代码托管与任务平台集成 | 18 | 仅保留 J16 |
| K | 内嵌浏览器与浏览器自动化 | 18 | K01–K15 有条件保留；删除 K16–K18 |
| L | SSH、WSL 与远程运行时 | 17 | 删除 |
| M | 移动端、Web 客户端与中继 | 15 | 删除 |
| N | 多 Agent 编排 | 14 | 保留；N13 仅本地嵌套 |
| O | 自动化与隔离执行环境 | 13 | 删除 O08–O13；O02 仅本机，其余保留 |
| P | Skills、MCP 与插件 | 13 | 删除 P05–P07，其余保留 |
| Q | CLI 与 Agent 操作接口 | 11 | 保留 |
| R | 移动模拟器与设备自动化 | 9 | 删除 |
| S | 活动、通知与工作概览 | 8 | 保留 |
| T | 个性化与桌面辅助（语音已移除） | 12 | 删除 T01–T06，其余保留 |
| U | 应用身份、网络与运维 | 14 | 删除 U01–U04、U06/U07/U11；U10 仅本地导出，其余保留 |
| V | 终端与数据底层能力（按依赖裁剪） | 14 | 保留；V14 仅本地协商 |
| W | Agent 专用适配（单独选择） | 40 | 仅保留 W01、W03、W06、W07 |

## A. 项目、仓库与工作区

证据入口：[worktrees.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/worktrees.mdx)、[worktrees-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/worktrees-bridge.ts)。

| 编号  | 功能               | 范围说明                             | 决定  | 备注 / 保留边界 |
| --- | ---------------- | -------------------------------- | --- | --------- |
| A01 | 添加本地 Git 仓库 | 将已有仓库加入项目列表。 | 保留 |  |
| A02 | 克隆仓库 | 从远程 Git 地址获取项目，可涉及目标运行主机。 | 保留 |  |
| A03 | 普通文件夹工作区 | 不要求目录属于 Git 仓库。 | 保留 |  |
| A04 | 项目分组与多仓库项目 | 把多个仓库组织在一个项目组中。 | 保留 |  |
| A05 | Git worktree 创建 | 每个任务拥有独立目录、分支和 Agent 会话。 | 保留 |  |
| A06 | 起始引用选择 | 从默认分支、现有分支、远程分支或指定提交创建。 | 保留 |  |
| A07 | 后台创建工作区 | 创建期间继续操作其他工作区。 | 保留 |  |
| A08 | 分支命名与命名前缀 | 设置创建分支的命名规则。 | 保留 |  |
| A09 | 工作区名称、图标与 Emoji | 用于侧边栏识别和整理。 | 保留 |  |
| A10 | 工作区列表、排序与过滤 | 按项目、休眠、默认分支、来源等筛选。 | 保留 |  |
| A11 | 父子工作区展示 | 显示、隐藏关联工作区及其层级。 | 保留 |  |
| A12 | 工作区看板 | 以看板方式查看和进入工作区。 | 保留 |  |
| A13 | 共享目录和忽略文件复制 | 通过共享路径、.worktreeinclude 等准备新工作区。 | 保留 |  |
| A14 | 稀疏检出预设 | 选择部分目录形成精简工作区。 | 保留 |  |
| A15 | 工作区创建与启动钩子 | 运行仓库配置的初始化、启动操作。 | 保留 |  |
| A16 | 关闭、删除与清理工作区 | 回收目录和关联资源。 | 保留 |  |
| A17 | 保留未合并分支检查 | 删除工作区后识别并处理保留的分支。 | 保留 |  |
| A18 | 空间占用分析与资源管理 | 分析工作区磁盘占用，辅助清理。 | 保留 |  |
| A19 | 工作区检查点 | 保存供人或 Agent 后续接手的工作进展记录。 | 保留 |  |
| A20 | 仓库级 orca.yaml 配置 | 维护项目运行、Agent、环境等配置；具体字段需按保留范围裁剪。 | 保留 |  |

## B. 窗口、布局与导航

证据入口：[tabs-panes-splits.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/tabs-panes-splits.mdx)、[quick-open.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/quick-open.mdx)、[settings.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/settings.mdx)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| B01 | 多标签页 | 终端、文件、浏览器等内容按标签组织。 | 保留 |  |
| B02 | 水平与垂直分屏 | 在同一工作区并排操作多个面板。 | 保留 |  |
| B03 | 拖拽分屏与标签移动 | 通过拖拽重排、跨组移动和创建分屏。 | 保留 |  |
| B04 | 标签组与固定布局边界 | 管理多组标签和分屏边界。 | 保留 |  |
| B05 | 最近标签切换 | 通过快捷键在最近使用的标签间跳转。 | 保留 |  |
| B06 | 快速打开和全局命令入口 | 检索工作区、文件、Agent、命令等入口。 | 保留 |  |
| B07 | 新标签统一输入框 | 输入文件、命令或网址；具体入口依赖保留模块。 | 保留 |  |
| B08 | 侧边栏与状态栏 | 显示项目导航、运行状态和快捷操作。 | 保留 |  |
| B09 | 多窗口与面板弹出 | 将部分内容放入独立窗口。 | 保留 |  |
| B10 | 浮动工作区 | 在仓库之外使用终端、浏览器和 Markdown 标签。 | 保留 |  |
| B11 | 外部编辑器与系统打开 | 在 VS Code 等应用或文件管理器中打开目标。 | 保留 |  |
| B12 | 布局和窗口状态恢复 | 重启后恢复标签、分屏和窗口安排。 | 保留 |  |

## C. 终端基础交互

证据入口：[terminal.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/terminal.mdx)、[pty-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/pty-bridge.ts)。

| 编号  | 功能                            | 范围说明                   | 决定  | 备注 / 保留边界 |
| --- | ----------------------------- | ---------------------- | --- | --------- |
| C01 | 本地交互式终端 | 在真实 PTY 中运行 Shell 和命令。 | 保留 |  |
| C02 | 多个终端与终端标签 | 一个工作区中保持多个独立终端。 | 保留 |  |
| C03 | 终端分屏 | 并排运行多个 Shell 或 Agent。 | 保留 |  |
| C04 | Shell 选择与启动参数 | 选择系统或自定义 Shell，并配置参数。 | 保留 |  |
| C05 | Shell 启动环境继承 | 加载登录环境、PATH 和用户配置。 | 保留 |  |
| C06 | Windows PowerShell 与 Git Bash | 选择 Windows 终端实现及回退行为。 | 保留 |  |
| C07 | Windows 管理员终端 | 按用户操作启动需要提升权限的终端。 | 保留 |  |
| C08 | 终端输入、粘贴与选择复制 | 基础文本输入和剪贴板交互。 | 保留 |  |
| C09 | OSC 52 剪贴板 | 允许受配置控制的 TUI 剪贴板写入。 | 保留 |  |
| C10 | 终端搜索 | 检索滚动缓冲区中的文本。 | 保留 |  |
| C11 | 终端链接与文件位置跳转 | 打开 URL、路径和文件行位置。 | 保留 |  |
| C12 | 链接操作菜单与路由 | 决定使用内置浏览器、系统浏览器或其他动作。 | 保留 |  |
| C13 | 复制终端上下文 | 提取输出，作为后续操作或提示词上下文。 | 保留 |  |
| C14 | 终端字体、光标和滚动设置 | 调整字号、光标、间距和滚动等体验。 | 保留 |  |
| C15 | 终端颜色主题 | 内置及自定义配色。 | 保留 |  |
| C16 | Ghostty 主题与配置导入 | 读取兼容的 Ghostty 设置。 | 保留 |  |
| C17 | Warp 及主题文件导入 | 导入已有终端配色。 | 删除 |  |
| C18 | 终端渲染模式与性能设置 | 控制 WebGL 等渲染相关选项。 | 保留 |  |
| C19 | 终端快捷命令 | 保存、粘贴或执行常用 Shell 命令。 | 保留 |  |
| C20 | 终端尺寸变化 | 窗口或分屏变化时调整 PTY 行列数。 | 保留 |  |

## D. Agent 启动、控制与状态

证据入口：[supported.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/supported.mdx)、[agents-sessions.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/agents-sessions.mdx)、[hooks-memory.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/hooks-memory.mdx)。

| 编号  | 功能              | 范围说明                                | 决定  | 备注 / 保留边界 |
| --- | --------------- | ----------------------------------- | --- | --------- |
| D01 | Agent 发现与可用性检测 | 检测当前主机安装的 CLI。 | 保留 |  |
| D02 | Agent 安装与配置引导 | 为受支持 Agent 提供安装、登录或配置入口。 | 删除 | 不提供应用内安装、登录或配置引导；保留 Agent 的外部安装方式待实现时确定。 |
| D03 | 默认 Agent | 为新会话或工作区选择默认 Agent。 | 保留 |  |
| D04 | 自定义 Agent 命令 | 通过自定义命令运行其他 CLI Agent。 | 保留 |  |
| D05 | 启动提示词与启动选项 | 配置初始任务、模型及适用的 Agent 参数。 | 保留 |  |
| D06 | Agent 权限模式 | 按 Agent 能力配置执行和确认方式。 | 保留 |  |
| D07 | 并行启动多个 Agent | 同一任务或不同任务同时交给多个会话。 | 保留 |  |
| D08 | 将文件和图片发送给 Agent | 把文件路径或附件加入提示词。 | 保留 |  |
| D09 | 继续提问与中断当前任务 | 向已有会话追加输入或停止当前处理。 | 保留 |  |
| D10 | Agent 状态检测 | 展示运行、等待输入、完成等状态。 | 保留 |  |
| D11 | Agent Hooks | 利用受支持 Agent 的钩子更新状态或上下文。 | 保留 |  |
| D12 | 仓库记忆文件 | 管理启动时可读取的项目上下文文件。 | 保留 |  |
| D13 | Agent 面板与团队会话集成 | 包括可选 Claude Agent Teams 等专用展示与启动适配。 | 保留 |  |
| D14 | Agent 休眠与自动恢复 | 按空闲条件释放后台会话，返回时恢复。 | 保留 |  |
| D15 | 运行期间保持计算机唤醒 | 按持续或 Agent 工作状态控制休眠。 | 保留 |  |

## E. 聊天界面与历史会话

证据入口：[native-chat.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/native-chat.mdx)、[session-history.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/session-history.mdx)、[ai-vault-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/ai-vault-bridge.ts)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| E01 | 聊天界面切换（实验性） | 在支持的 Agent 上切换终端与结构化聊天视图。 | 保留 |  |
| E02 | 流式消息和工具记录 | 将支持的会话日志展示为聊天内容。 | 保留 |  |
| E03 | 聊天输入框与草稿 | 编辑提示词，并在可支持的重连情形下保留草稿。 | 保留 |  |
| E04 | 聊天附件 | 添加文件或图片；支持程度取决于 Agent 和主机。 | 保留 |  |
| E05 | 斜杠命令与 Skills 选择 | 在聊天输入框中发现并调用相应命令。 | 保留 |  |
| E06 | 模型、推理强度与会话选项 | 按 Agent 暴露的能力选择设置。 | 保留 |  |
| E07 | 结构化问题与权限卡片 | 将受支持 Agent 的问题展示为可操作卡片。 | 保留 |  |
| E08 | 本机会话历史扫描 | 发现不同 Agent 保存在本机的历史会话。 | 保留 |  |
| E09 | 按项目、目录和 Agent 筛选历史 | 对会话分组、排序、过滤空会话。 | 保留 |  |
| E10 | 历史会话恢复 | 在相应目录启动 Agent 的 resume 命令。 | 保留 |  |
| E11 | 日志打开与恢复命令复制 | 打开原始记录或复制 ID、日志路径和恢复命令。 | 保留 |  |
| E12 | 会话全文搜索与索引 | 检索历史内容，管理索引开关与清理。 | 保留 |  |
| E13 | 子 Agent 会话浏览 | 发现并展示相应的子会话记录。 | 保留 |  |
| E14 | 历史会话删除 | 删除受支持的历史记录。 | 保留 |  |
| E15 | 会话标题与自动命名 | 生成或解析会话名称以便查找。 | 保留 |  |

## F. 账号、用量与凭据

证据入口：[usage-tracking.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/usage-tracking.mdx)、[codex-hot-swap.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/codex-hot-swap.mdx)、[AccountsPane.tsx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/renderer/src/components/settings/AccountsPane.tsx)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| F01 | Claude 多账号管理 | 添加、选择、移除受支持的 Claude 账号。 | 删除 |  |
| F02 | Codex 多账号管理 | 管理账号及相关本地配置。 | 删除 |  |
| F03 | 运行中账号热切换 | 在支持的会话上切换登录身份。 | 删除 |  |
| F04 | 其他提供商账号管理 | Cursor、Grok、Antigravity、ZCode 等专用集成；可分别裁剪。 | 删除 | 尚未完成：专用集成余项按 B6 对应 W 任务闭包清理；本轮 B3-ACCOUNT/B3-USAGE 不扩展该范围。 |
| F05 | API Key 与提供商凭据 | 管理 OpenCode、MiniMax 等集成所需凭据。 | 删除 |  |
| F06 | Agent 配置目录与隔离 | 控制不同会话和账号的本地配置来源。 | 删除 |  |
| F07 | Codex 配置同步与服务设置 | 包含相关共享服务、独立运行和配置适配。 | 删除 |  |
| F08 | 当前账号用量 | 展示支持的提供商额度或本地用量数据。 | 删除 |  |
| F09 | 配额重置与限流提示 | 展示窗口、剩余时间和接近限额的状态。 | 删除 |  |
| F10 | 用量汇总面板 | 比较多个提供商的用量和账号状态。 | 删除 |  |
| F11 | 会话使用统计与估算成本 | 汇总使用情况；估算值不等同于账单。 | 删除 |  |
| F12 | 系统凭据保护 | 利用系统密钥存储等能力保护保留的凭据。 | 保留 | 保留系统 keychain/safeStorage 及正常 Git、GitHub、SSH 和 Agent CLI 自有凭据保护。 |

## G. 文件浏览、代码编辑与搜索

证据入口：[file-explorer.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/editing/file-explorer.mdx)、[monaco.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/editing/monaco.mdx)、[fs-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/fs-bridge.ts)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| G01 | 文件树 | 浏览工作区目录与文件。 | 保留 |  |
| G02 | 文件创建、重命名、移动和删除 | 常见文件管理动作。 | 保留 |  |
| G03 | 代码编辑器 | 基于 Monaco 的源码编辑。 | 保留 |  |
| G04 | 语法高亮与编辑辅助 | 使用已有语言能力；不等于完整 IDE 后端。 | 保留 |  |
| G05 | 自动保存 | 将编辑内容写入磁盘。 | 保留 |  |
| G06 | 文件内查找和替换 | 定位和修改当前文件内容。 | 保留 |  |
| G07 | 跨文件搜索 | 通过搜索服务和 ripgrep 等定位代码。 | 保留 |  |
| G08 | 快速文件打开 | 按名称或路径定位文件。 | 保留 |  |
| G09 | 文件变更监听 | 同步外部命令或 Agent 造成的文件变化。 | 保留 |  |
| G10 | 文件与图片拖拽 | 在编辑器、文件树和 Agent 输入间传递内容。 | 保留 |  |
| G11 | 文件位置和外部链接打开 | 打开路径、行号、远程文件链接等。 | 保留 |  |
| G12 | 忽略规则与大目录处理 | 识别被忽略内容，并辅助处理不宜纳入 Git 的大目录。 | 保留 |  |

## H. 文档编辑、预览与产物

证据入口：[markdown.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/editing/markdown.mdx)、[viewers.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/editing/viewers.mdx)、[artifacts](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/renderer/src/components/artifacts)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| H01 | Markdown 源码与富文本编辑 | 阅读或编辑 Markdown 内容。 | 保留 |  |
| H02 | Markdown 斜杠菜单、表格和目录 | 结构化文档编辑辅助。 | 保留 |  |
| H03 | Markdown 内部链接与 Front matter | 文档内导航及元数据编辑。 | 保留 |  |
| H04 | 文档审阅注释 | 对内容添加审阅标注。 | 保留 |  |
| H05 | HTML 预览 | 预览工作区 HTML 内容。 | 保留 |  |
| H06 | Mermaid 图预览 | 渲染文档或文件中的 Mermaid 图。 | 保留 |  |
| H07 | PDF 预览 | 在应用中阅读 PDF。 | 保留 |  |
| H08 | 图片预览 | 查看图片文件。 | 保留 |  |
| H09 | CSV 与 TSV 查看 | 以表格形式查看分隔文本。 | 保留 |  |
| H10 | Jupyter Notebook 查看 | 展示 Notebook 单元和已有结果；不预设完整内核执行能力。 | 保留 |  |
| H11 | 公开产物发布 | 将支持的 HTML、Markdown 等内容发布为可访问链接。 | 删除 | 移除公开产物发布及服务依赖。 |
| H12 | 产物列表、搜索与预览 | 管理账户拥有的已发布产物。 | 删除 | 随产物发布移除；不影响本地文件搜索与预览。 |
| H13 | 产物链接复制与删除 | 分享链接或撤销已发布内容。 | 删除 | 随产物发布移除。 |

## I. Git 与源码审阅

证据入口：[git-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/git-bridge.ts)、[diff-viewer.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/diff-viewer.mdx)、[annotate-ai-diff.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/annotate-ai-diff.mdx)、[attribution.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/attribution.mdx)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| I01 | Git 状态与变更文件列表 | 查看已修改、已暂存和未跟踪文件。 | 保留 |  |
| I02 | 工作区与暂存区 Diff | 查看当前修改内容。 | 保留 |  |
| I03 | 分支、提交与基准比较 | 比较指定引用之间的差异。 | 保留 |  |
| I04 | 提交历史 | 浏览提交和提交相关文件。 | 保留 |  |
| I05 | 暂存与取消暂存 | 支持单文件和批量操作。 | 保留 |  |
| I06 | 放弃修改 | 丢弃选定文件或批量修改。 | 保留 |  |
| I07 | 创建提交 | 填写提交信息并提交。 | 保留 |  |
| I08 | Fetch、Pull 与 Push | 同步远程仓库。 | 保留 |  |
| I09 | 基准分支更新与 Rebase | 包含快进、从基准分支变基等操作。 | 保留 |  |
| I10 | Fork 同步 | 从上游更新 Fork。 | 保留 |  |
| I11 | 冲突状态与中止操作 | 显示进行中的合并/变基，并提供中止操作。 | 保留 |  |
| I12 | 子模块状态 | 查看仓库子模块相关状态。 | 保留 |  |
| I13 | Diff 行内评论 | 对具体代码行添加审阅意见。 | 保留 |  |
| I14 | 将审阅意见发送给 Agent | 汇总评论并交给会话继续修改。 | 保留 |  |
| I15 | AI 与人工代码归属标记 | 显示本地来源信息，并支持相应元数据导出。 | 保留 |  |
| I16 | AI 生成提交信息 | 根据变更生成提交说明。 | 保留 |  |
| I17 | AI 生成 PR 标题和描述 | 辅助准备 PR 内容。 | 保留 |  |

## J. 代码托管与任务平台集成

证据入口：[github-pull-request-api.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/github-pull-request-api.ts)、[github-work-item-api.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/github-work-item-api.ts)、[gitlab-api.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/gitlab-api.ts)、[linear.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/linear.mdx)、[jira.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/jira.mdx)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| J01 | GitHub 账号与认证诊断 | 关联账号、检查 gh 状态及 API 配额。 | 删除 |  |
| J02 | GitHub Issues | 浏览、创建、编辑问题及评论。 | 删除 |  |
| J03 | GitHub Projects | 查看项目、视图并更新项目项字段。 | 删除 |  |
| J04 | GitHub PR 创建与关联 | 将分支、任务和工作区关联到 PR。 | 删除 |  |
| J05 | GitHub PR 详情与 Diff | 在应用内查看 PR、文件和讨论。 | 删除 |  |
| J06 | GitHub PR 评论与审阅线程 | 回复、行内评论、解决线程和标记文件已读。 | 删除 |  |
| J07 | GitHub PR 检查与日志 | 查看检查详情，并重跑支持的检查。 | 删除 |  |
| J08 | GitHub PR 生命周期 | 审阅人、草稿/就绪、关闭/重开、合并和自动合并。 | 删除 |  |
| J09 | GitLab Issues 与任务 | 浏览和管理 GitLab 问题及工作项。 | 删除 |  |
| J10 | GitLab Merge Requests | 查看、评论、审阅人设置及合并等操作。 | 删除 |  |
| J11 | GitLab CI 作业 | 查看作业日志及重试。 | 删除 |  |
| J12 | Bitbucket 集成 | 相应代码托管认证及审阅集成，具体边界以该模块为准。 | 删除 |  |
| J13 | Gitea 集成 | 相应代码托管服务适配。 | 删除 |  |
| J14 | Azure DevOps 集成 | 相应代码托管及任务服务适配。 | 删除 |  |
| J15 | Linear 集成 | 浏览任务、关联工作区，并通过相应入口操作。 | 删除 |  |
| J16 | Jira 自部署集成 | 仅连接自部署 Jira 实例，浏览任务、关联工作区并执行保留的任务操作；不支持 Jira Cloud。 | 保留 | 用户明确：仅保留自部署 Jira。实例地址和认证方式待实现方案确定，不恢复 F 组账号托管功能。 |
| J17 | 统一任务页与从任务创建工作区 | 汇总已启用平台的任务入口。 | 删除 |  |
| J18 | Hosted Review 与堆叠审阅 | 独立于普通本地 Diff 的托管审阅入口。 | 删除 |  |

## K. 内嵌浏览器与浏览器自动化

证据入口：[overview.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/browser/overview.mdx)、[design-mode.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/browser/design-mode.mdx)、[profiles.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/browser/profiles.mdx)、[browser-backend.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/browser/browser-backend.ts)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| K01 | 工作区内嵌浏览器 | 每个工作区拥有相应的浏览器页面。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K02 | 地址栏、历史与搜索 | 访问 URL 或使用默认搜索引擎。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K03 | 浏览器标签和弹窗 | 新建、关闭、恢复标签，并处理页面弹窗。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K04 | 导航、刷新与页内搜索 | 前进、后退、普通/强制刷新及查找。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K05 | 下载管理 | 处理页面下载和下载文件。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K06 | 浏览器身份配置 | 管理独立 profile、登录态和存储。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K07 | Cookie 导入与登录辅助 | 导入可支持的浏览器 Cookie 或辅助登录。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K08 | 工作区与 profile 隔离 | 隔离不同页面身份和会话数据。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K09 | 视口与设备模拟 | 设置屏幕尺寸及移动设备相关参数。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K10 | 开发者调试与页面检查 | 使用浏览器调试能力检查页面。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K11 | Design Mode 元素选择 | 从网页中点选需要反馈的 UI 元素。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K12 | 元素 HTML、CSS 与截图提取 | 将所选元素的上下文加入 Agent 提示词。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K13 | 源代码位置关联 | 有可用开发映射时定位对应源码。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K14 | Agent 浏览器自动化 | 页面快照、点击、输入和其他脚本化操作。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K15 | 浏览器截图、录屏/画面流 | 按现有后端能力获取页面画面。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| K16 | 通过 SSH 主机路由浏览流量 | 网页访问和 DNS 可通过工作区主机。 | 删除 | 移除远程浏览器和 SSH 路由。 |
| K17 | 远程页面与客户端页面模式 | 选择在服务端渲染或在当前设备承载相应页面。 | 删除 | 移除远程页面模式。 |
| K18 | 浏览器内容分享为产物 | 将适用页面内容转入产物发布流程。 | 删除 | 随公开产物发布移除。 |

## L. SSH、WSL 与远程运行时

证据入口：[ssh.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/ssh.mdx)、[remote-servers.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/remote-servers.mdx)、[ways-to-run.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/ways-to-run.mdx)、[wsl-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/wsl-bridge.ts)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| L01 | SSH 主机管理与配置导入 | 维护远程目标及连接参数。 | 删除 |  |
| L02 | SSH 认证、密钥与主机校验 | 连接所需认证和主机身份验证。 | 删除 |  |
| L03 | SSH 远程工作区 | 在远程主机创建、打开和管理工作区。 | 删除 |  |
| L04 | SSH 远程终端与 Agent | 在远程主机运行交互任务。 | 删除 |  |
| L05 | SSH 远程文件编辑与 Git | 在同一应用中操作远程工作区文件和仓库。 | 删除 |  |
| L06 | SSH 重连与会话恢复 | 连接中断后重新附着已有会话。 | 删除 |  |
| L07 | 端口发现与转发 | 发现开发服务，并在相应入口打开或转发。 | 删除 |  |
| L08 | 远程服务安装与维护 | 部署、诊断、重启及更新受管理服务。 | 删除 |  |
| L09 | Remote Orca Server 连接 | 连接桌面或 headless 提供的运行时。 | 删除 |  |
| L10 | 多客户端共享运行时 | 多个受授权客户端操作同一运行时。 | 删除 |  |
| L11 | 无界面运行与 serve | 后台提供 RPC、终端及相关服务。 | 删除 |  |
| L12 | 远程项目位置与克隆 | 指定项目在目标主机上的实际位置。 | 删除 |  |
| L13 | WSL 发行版发现与运行 | 选择发行版并在其中运行工作区/Agent。 | 删除 |  |
| L14 | Windows 与 WSL 路径和环境适配 | 处理路径、启动参数和环境差异。 | 删除 |  |
| L15 | WSL CLI、Hooks 与主机管理 | 维护发行版内需要的配套能力。 | 删除 |  |
| L16 | 工作区主机迁移入口 | 相关移动/迁移向导和增量处理，依模块支持范围。 | 删除 |  |
| L17 | 远程协议版本兼容 | 独立升级客户端和服务端时维持可识别的能力边界。 | 删除 |  |

## M. 移动端、Web 客户端与中继

证据入口：[mobile.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/mobile.mdx)、[app](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/mobile/app)、[cloud](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/cloud)、[mobile-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/mobile-bridge.ts)。

| 编号  | 功能                | 范围说明                | 决定  | 备注 / 保留边界 |
| --- | ----------------- | ------------------- | --- | --------- |
| M01 | iOS 移动客户端 | 手机和平板端访问受支持的工作流。 | 删除 |  |
| M02 | Android 移动客户端 | Android 应用与 APK 分发。 | 删除 |  |
| M03 | Web 客户端 | 通过浏览器访问相应运行时。 | 删除 |  |
| M04 | 二维码与链接配对 | 建立设备和主机的授权关系。 | 删除 |  |
| M05 | 配对设备管理与撤销 | 查看并移除已授权设备。 | 删除 |  |
| M06 | 局域网与自定义地址连接 | 指定主机、端口和网络入口。 | 删除 |  |
| M07 | 云中继服务 | 支持无法直接连接时的相应通信路径。 | 删除 |  |
| M08 | 设备认证与通信加密 | 保护保留的远程会话数据。 | 删除 |  |
| M09 | 移动端 Agent 监控与终端操作 | 查看状态，输入命令和回复。 | 删除 |  |
| M10 | 移动端聊天、附件与模型选项 | 使用受支持的结构化会话界面。 | 删除 |  |
| M11 | 移动端工作区创建与切换 | 在手机上创建和进入工作区。 | 删除 |  |
| M12 | 移动端文件、Diff 和源码操作 | 访问远程文件与源码审阅入口。 | 删除 |  |
| M13 | 移动端账号与用量 | 查看并操作相应主机的受支持账号能力。 | 删除 |  |
| M14 | 移动端浏览器画面与控制 | 访问主机承载的相应浏览页面。 | 删除 |  |
| M15 | 移动端通知与设备设置 | 通知、终端字号、输入和连接诊断等。 | 删除 |  |

## N. 多 Agent 编排

证据入口：[orchestration.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/orchestration.mdx)、[orchestration](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/runtime/orchestration)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| N01 | Run 运行记录 | 保存一次编排的任务命名空间与消息入口。 | 保留 |  |
| N02 | 任务创建与规格 | 定义任务内容、状态和相关信息。 | 保留 |  |
| N03 | 任务依赖 DAG | 使用依赖关系控制任务就绪。 | 保留 |  |
| N04 | Worker 派发 | 选择终端、Agent、工作区或目标环境执行任务。 | 保留 |  |
| N05 | Dispatch 尝试记录 | 独立追踪同一任务的多次执行。 | 保留 |  |
| N06 | Worker 模型与参数选择 | 按 Agent 支持能力指定执行参数。 | 保留 |  |
| N07 | Agent 消息与收件箱 | 点对点和受范围约束的群组通信。 | 保留 |  |
| N08 | 阻塞提问与问答 | Worker 等待协调者提供缺失决策。 | 保留 |  |
| N09 | Decision Gate | 显式阻塞或释放依赖决策的任务。 | 保留 |  |
| N10 | 心跳、完成与升级报告 | 接收 heartbeat、worker_done 和 escalation 等事件。 | 保留 |  |
| N11 | 重试与执行恢复 | 处理明确的重试关系及中断后的恢复。 | 保留 |  |
| N12 | Worker 复用、释放与终端保留 | 完成后复用会话或释放编排拥有的资源。 | 保留 |  |
| N13 | 本地嵌套 Worker | 同一主机内协调父子 Run；移除跨主机联邦 Worker。 | 保留 | 本轮收缩为本地能力。 |
| N14 | 收敛与卡住状态识别 | 判断任务是否全部结束或依赖无法继续。 | 保留 |  |

## O. 自动化与隔离执行环境

证据入口：[automations.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/automations.mdx)、[ways-to-run.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/ways-to-run.mdx)、[ephemeral-vm-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/ephemeral-vm-bridge.ts)。

| 编号  | 功能            | 范围说明                      | 决定  | 备注 / 保留边界 |
| --- | ------------- | ------------------------- | --- | --------- |
| O01 | 定时自动化创建与编辑 | 配置周期性 Agent 任务。 | 保留 |  |
| O02 | 自动化运行位置（仅本机） | 仅允许本机执行，不提供远程、云端或 Docker 目标。 | 保留 | 本轮收缩为本地能力。 |
| O03 | 运行前检查 | 在执行前检查目标和必要条件。 | 保留 |  |
| O04 | 启用、停用与手动运行 | 管理自动化并按需触发。 | 保留 |  |
| O05 | 错过计划的宽限处理 | 按配置处理错过的运行时间。 | 保留 |  |
| O06 | 复用自动化会话 | 继续使用已有会话执行后续运行。 | 保留 |  |
| O07 | 自动化运行记录与结果 | 查看相应状态及处理结果。 | 保留 |  |
| O08 | Cloud VM（实验性） | 按工作区使用临时云端或隔离环境。 | 删除 | 移除跨主机及云端执行。 |
| O09 | 环境 Recipe 与目录 | 选择、安装和管理可用环境配方。 | 删除 | 云端、远程、本地 Docker 环境均移除，不保留专用环境配方目录。 |
| O10 | 环境创建、附着与取消 | 准备运行时并关联工作区。 | 删除 | 随隔离执行环境移除；不影响普通本地进程。 |
| O11 | 环境暂停、恢复和回收 | 控制临时环境生命周期。 | 删除 | 随隔离执行环境移除。 |
| O12 | 本地 Docker 类环境 | 通过可支持的 Recipe 使用本地隔离运行环境。 | 删除 | 用户明确移除本地 Docker。 |
| O13 | 环境诊断与清理 | 检查环境依赖并回收剩余资源。 | 删除 | 随隔离执行环境移除；普通应用诊断与工作区清理仍保留。 |

## P. Skills、MCP 与插件

证据入口：[skills.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/skills.mdx)、[skills-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/skills-bridge.ts)、[plugins-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/plugins-bridge.ts)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| P01 | Skills 发现与列表 | 发现已安装、可安装及受支持位置的技能。 | 保留 |  |
| P02 | Skills 安装、卸载和删除 | 预览并执行技能管理动作。 | 保留 |  |
| P03 | Skills 更新与健康状态 | 检查版本、新鲜度和需处理状态。 | 保留 |  |
| P04 | 版本匹配的技能指南 | 让 Agent 获取与当前 Orca 版本匹配的操作指引。 | 保留 |  |
| P05 | 私有 Skills 分享与安装 | 跨主机分享、解析并安装技能。 | 删除 | 移除私有 Skills 分享；普通本地安装仍保留。 |
| P06 | Skills 包、版本与撤销管理 | 管理受支持的私有分享和包版本。 | 删除 | 随私有分享移除；普通插件版本管理仍保留。 |
| P07 | Skills 跨主机与 WSL 目标 | 选择技能安装或发现的位置。 | 删除 | 移除跨主机和 WSL Skills 目标。 |
| P08 | MCP 配置与服务发现入口 | 维护/发现支持的 MCP 配置；具体提供商能力需分别验证。 | 保留 |  |
| P09 | 插件系统开关（实验性） | 在明确启用后加载插件。 | 保留 |  |
| P10 | 插件 Marketplace 管理 | 添加 Git 来源并浏览插件。 | 保留 |  |
| P11 | 插件能力预览与启用 | 查看面板、命令、语言包等保留能力声明。 | 保留 | 不恢复模拟器及已删除隔离执行环境的 Recipe 入口。 |
| P12 | 插件安装、更新与回滚 | 管理插件版本和移除。 | 保留 |  |
| P13 | 插件日志与诊断 | 检查插件运行状态和日志。 | 保留 |  |

## Q. CLI 与 Agent 操作接口

证据入口：[overview.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/overview.mdx)、[reference.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/reference.mdx)、[computer-use.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/computer-use.mdx)。

| 编号  | 功能                  | 范围说明                      | 决定  | 备注 / 保留边界 |
| --- | ------------------- | ------------------------- | --- | --------- |
| Q01 | CLI 安装与 Shell 注册 | 让用户和 Agent 调用应用命令。 | 保留 |  |
| Q02 | 工作区 CLI | 创建、列表、打开和管理工作区。 | 保留 |  |
| Q03 | 终端 CLI | 读取终端、发送输入和执行相关操作。 | 保留 |  |
| Q04 | 会话、状态与配置 CLI | 访问应用运行状态和受支持配置。 | 保留 |  |
| Q05 | 浏览器 CLI | 页面快照、点击、填充和相关自动化命令。 | 保留 | 有条件保留：先验证内嵌浏览器；技术不可行时允许移除，并联动更新验收。 |
| Q06 | Skills 与 MCP 相关 CLI | 使用技能发现、指南和相关服务入口。 | 保留 |  |
| Q07 | 编排 CLI | 任务、消息、派发、问答和等待事件。 | 保留 |  |
| Q08 | 自动化 CLI | 创建和管理计划运行。 | 保留 |  |
| Q09 | 工作区检查点 CLI | 保存和读取任务进展。 | 保留 |  |
| Q10 | Computer Use | 让 Agent 通过受支持的系统能力操作桌面应用。 | 保留 |  |
| Q11 | Computer Use 权限与设置 | 配置相关授权和系统能力检测。 | 保留 |  |

## R. 移动模拟器与设备自动化

证据入口：[emulator](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/emulator)、[emulator-pane](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/renderer/src/components/emulator-pane)、[skill-guides](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/skill-guides)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| R01 | iOS 模拟器设备发现与接入 | 发现并连接支持的 iOS Simulator。 | 删除 |  |
| R02 | iOS 模拟器画面与输入 | 查看画面并发送支持的交互操作。 | 删除 |  |
| R03 | iOS 辅助功能树 | 获取可支持的设备界面结构。 | 删除 |  |
| R04 | Android SDK 与设备发现 | 检测 SDK、模拟器与 adb 设备。 | 删除 |  |
| R05 | Android AVD 启动与接入 | 启动或连接支持的 Android 虚拟设备。 | 删除 |  |
| R06 | Android 画面流与输入 | 利用相应后端显示画面并发送点击、手势等。 | 删除 |  |
| R07 | Android 应用与权限操作 | 对支持的设备执行应用和权限相关动作。 | 删除 |  |
| R08 | Android 日志与 UI 树 | 读取 logcat 和 UIAutomator 等信息。 | 删除 |  |
| R09 | 模拟器 Agent 工具与技能 | 通过 CLI/技能访问设备自动化能力。 | 删除 |  |

## S. 活动、通知与工作概览

证据入口：[activity.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/activity.mdx)、[notifications.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/notifications.mdx)、[agents-sessions.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/agents-sessions.mdx)、[dashboard-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/dashboard-bridge.ts)。

| 编号  | 功能                   | 范围说明                                  | 决定  | 备注 / 保留边界 |
| --- | -------------------- | ------------------------------------- | --- | --------- |
| S01 | Agent 活动流 | 集中查看完成、阻塞、工作区创建和回复摘要。 | 保留 |  |
| S02 | 通知中心与未读状态 | 按事件查看、跳转和标记已读。 | 保留 |  |
| S03 | 系统通知 | Agent 完成或需要处理时发送桌面通知。 | 保留 |  |
| S04 | 通知分类与声音设置 | 控制保留的通知种类和提示方式。 | 保留 |  |
| S05 | Agent Dashboard（实验性） | 以 Needs You、Working、Done 等状态组织 Agent。 | 保留 |  |
| S06 | Dashboard 搜索与过滤 | 按项目、工作区、PR 等条件筛选。 | 保留 |  |
| S07 | Dashboard 独立窗口 | 弹出概览，并跳转到相应 Agent。 | 保留 |  |
| S08 | 使用统计概览 | 展示工作活动或使用汇总；与账号额度面板可独立裁剪。 | 保留 |  |

## T. 语音、个性化与桌面辅助

证据入口：[speech-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/speech-bridge.ts)、[pet-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/pet-bridge.ts)、[settings.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/settings.mdx)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| T01 | 语音输入 | 将语音转为输入框中的文字。 | 删除 | 语音模块整体移除：无录音、转写、模型管理或专用快捷入口。 |
| T02 | 麦克风选择与快捷录音模式 | 切换设备，支持按住或开关录音。 | 删除 | 语音模块整体移除：无录音、转写、模型管理或专用快捷入口。 |
| T03 | 本地语音模型 | 下载、选择、取消或删除离线模型。 | 删除 | 语音模块整体移除：无录音、转写、模型管理或专用快捷入口。 |
| T04 | 云端语音识别 | 配置相应 API 凭据并使用云模型。 | 删除 | 语音模块整体移除，包含本地与云端识别。 |
| T05 | 桌面宠物 | 展示动画宠物及相关交互。 | 删除 |  |
| T06 | 宠物导入与管理 | 导入资源包、选择和删除。 | 删除 |  |
| T07 | 界面主题与外观 | 颜色、对比度、窗口和侧栏外观。 | 保留 |  |
| T08 | 界面语言 | 系统语言跟随及多语言切换。 | 保留 |  |
| T09 | 界面缩放与字体 | 调整整体缩放和相关显示设置。 | 保留 |  |
| T10 | 自定义快捷键 | 检索、录入、修改和移除快捷键。 | 保留 |  |
| T11 | 应用图标选择 | 在支持的平台调整应用图标。 | 保留 |  |
| T12 | 系统托盘和 Dock 行为 | 处理后台入口、激活和窗口显示方式。 | 保留 |  |

## U. 应用身份、网络与运维

证据入口：[orca-profiles-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/orca-profiles-bridge.ts)、[settings.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/settings.mdx)、[telemetry.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/telemetry.mdx)、[updater](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/updater)、[diagnostics](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/diagnostics)。

| 编号  | 功能               | 范围说明                    | 决定  | 备注 / 保留边界 |
| --- | ---------------- | ----------------------- | --- | --------- |
| U01 | 本地 Profile | 在一台设备上隔离不同应用配置环境。 | 删除 |  |
| U02 | 云账号登录与关联 Profile | 关联 Orca 服务身份及相应资源。 | 删除 |  |
| U03 | 组织选择与成员管理 | 成员邀请、角色调整及移除等服务端能力。 | 删除 | 随账号、公开分享等服务能力移除。 |
| U04 | 项目跨 Profile 转移 | 在应用配置空间之间转移项目关联。 | 删除 | 随 Profile 及服务分享能力移除。 |
| U05 | 代理与高级网络设置 | 管理保留模块的网络访问方式。 | 保留 |  |
| U06 | 自动更新与更新通道 | 检查、下载和安装应用更新。 | 删除 | 本轮先移除自动检查、下载、安装及更新通道；本地打包后手动安装。 |
| U07 | 本地构建与预发布更新入口 | 选择受支持的测试/本地构建。 | 删除 | 随自动更新移除应用内本地构建/预发布更新入口；不影响开发者构建安装包。 |
| U08 | 首次启动引导与功能提示 | 引导安装、配置及常见工作流。 | 保留 |  |
| U09 | 环境诊断与故障排查 | 检查运行依赖、主机状态和错误。 | 保留 |  |
| U10 | 崩溃报告本地导出 | 本地收集、查看和导出脱敏崩溃诊断资料。 | 保留 | 移除反馈上传、提交入口及后台发送；不恢复云反馈服务。 |
| U11 | 匿名遥测及隐私开关 | 产品使用事件及用户控制。 | 删除 | 本轮先移除匿名遥测及相关开关，无遥测采集或发送。 |
| U12 | 日志、性能与内存诊断 | 排查终端、进程、网络及资源问题。 | 保留 |  |
| U13 | 缓存与维护清理 | 回收应用缓存和可清理资源。 | 保留 |  |
| U14 | 推广入口与 Star 提示 | 上游产品推广或 GitHub Star 入口。 | 保留 |  |

## V. 终端与数据底层能力（按依赖裁剪）

证据入口：[daemon-entry.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/daemon/daemon-entry.ts)、[headless-emulator.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/daemon/headless-emulator.ts)、[terminal-multiplex-round-robin.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/runtime/rpc/terminal-multiplex-round-robin.ts)、[README.md](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/packages/process-host/README.md)、[persistence](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/persistence)。

| 编号 | 功能 | 范围说明 | 决定 | 备注 / 保留边界 |
| --- | --- | --- | --- | --- |
| V01 | 独立终端 daemon | 终端进程独立于桌面窗口运行。 | 保留 |  |
| V02 | 桌面退出后继续运行 | 在选择的退出策略下保留后台任务。 | 保留 |  |
| V03 | 桌面重连已有会话 | 重新打开应用后附着仍存活的终端。 | 保留 |  |
| V04 | 终端屏幕状态与快照 | 维护光标、模式、当前屏幕和滚动相关状态。 | 保留 |  |
| V05 | 输出历史与画面恢复 | 重启客户端或重连时恢复显示。 | 保留 |  |
| V06 | 终端输出限流与背压 | 防止高输出会话拖垮内存或界面。 | 保留 |  |
| V07 | 多终端公平调度 | 避免某个会话挤占其他终端的数据通路。 | 保留 |  |
| V08 | 输入确认与重连序列 | 区分已接受输入与未确认输入，避免错误重放。 | 保留 |  |
| V09 | 进程树归属与终止 | 正确管理子进程和孙进程生命周期。 | 保留 |  |
| V10 | 终端存活与健康检测 | 区分进程退出、通路断开和 I/O 不推进。 | 保留 |  |
| V11 | 会话和布局持久化 | 保存保留功能所需的状态。 | 保留 |  |
| V12 | 配置迁移与异常恢复 | 处理历史数据、锁及失败恢复。 | 保留 |  |
| V13 | 本地 RPC 与认证 | 桌面、CLI 和 daemon 之间的安全通信边界。 | 保留 |  |
| V14 | 本地能力协商与兼容 | 仅桌面、CLI 与本机 daemon 的能力与版本诊断，不保留远程或移动协议。 | 保留 | 本轮收缩为本地能力。 |

## W. Agent 专用适配（单独选择）

证据入口：[支持的 Agent](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/supported.mdx)。下列 40 项按该提交的文档名单列出。

每个 Agent 可选择“专用适配 / 仅自定义终端命令 / 不支持 / 待定”。**能在终端启动，不代表具有状态、用量、账号切换、历史恢复或聊天界面等深度集成。**本表决定接入范围；D、E、F 组决定深度能力。Claude Agent Teams 是单独能力，不是另一个独立 CLI。

| 编号 | Agent / 能力 | 上游文档说明 | 决定 | 备注 |
| --- | --- | --- | --- | --- |
| W01 | Claude Code | Deep integration: usage, hot-swap, hooks | 保留 | 仅保留 Claude Code 适配；不保留 F 组账号、用量和热切换，也不提供 D02 安装引导。 |
| W02 | Claude Agent Teams | Disabled by default — enable under Settings → Agents to launch via orca claude-teams with native panes for each teammate | 删除 |  |
| W03 | Codex | Deep integration: usage, hot-swap | 保留 | 仅保留 Codex 适配；不保留 F 组账号、用量和热切换，也不提供 D02 安装引导。 |
| W04 | Grok | Auto-setup | 删除 |  |
| W05 | GitHub Copilot CLI | Auto-setup | 删除 |  |
| W06 | OpenCode | Auto-setup, status | 保留 | 仅保留 OpenCode 适配；不提供 D02 安装引导及 F 组凭据管理。 |
| W07 | Pi | Auto-setup, hooks, status | 保留 | 仅保留 Pi 适配；不提供 D02 安装引导。 |
| W08 | OMP | Auto-setup, hooks, status | 删除 |  |
| W09 | Prime Agent | Auto-setup, hooks, status, session history | 删除 |  |
| W10 | Gemini | Auto-setup | 删除 |  |
| W11 | Antigravity | Auto-setup, hooks, status | 删除 |  |
| W12 | Ante | Auto-setup, status | 删除 |  |
| W13 | Aider | Auto-setup | 删除 |  |
| W14 | Goose | Auto-setup | 删除 |  |
| W15 | Amp | Auto-setup | 删除 |  |
| W16 | Kilocode | Auto-setup | 删除 |  |
| W17 | Kiro | Auto-setup | 删除 |  |
| W18 | Charm Crush | Auto-setup | 删除 |  |
| W19 | Auggie | Auto-setup | 删除 |  |
| W20 | Autohand | Auto-setup | 删除 |  |
| W21 | Cline | Auto-setup | 删除 |  |
| W22 | CodeBuddy | npm install -g @tencent-ai/codebuddy-code | 删除 |  |
| W23 | Codebuff | Auto-setup | 删除 |  |
| W24 | Freebuff | Auto-setup | 删除 |  |
| W25 | Command Code | Auto-setup, status | 删除 |  |
| W26 | Muse | macOS/Linux; trusts the workspace at launch | 删除 |  |
| W27 | DeepSeek Harness | Launched through its dsh-tui profile; hooks, status, questions, resume | 删除 |  |
| W28 | ZCode | Deep integration; needs a zcode CLI that ships the TUI (see note below) | 删除 |  |
| W29 | Continue | Auto-setup | 删除 |  |
| W30 | Cursor CLI | Deep integration | 删除 |  |
| W31 | Devin | Auto-setup | 删除 |  |
| W32 | Droid (Factory) | Auto-setup, hooks, status | 删除 |  |
| W33 | Kimi | Auto-setup | 删除 |  |
| W34 | Mistral Vibe | Auto-setup | 删除 |  |
| W35 | MiniMax | Auto-setup, usage tracking, rate-limit tracking | 删除 |  |
| W36 | Qwen Code | Auto-setup via the installed qwen executable | 删除 |  |
| W37 | Rovo Dev | Auto-setup | 删除 |  |
| W38 | Hermes | Auto-setup | 删除 |  |
| W39 | OpenClaw | Auto-setup | 删除 |  |
| W40 | Trae | Auto-setup via traecli (TRAE CN CLI) | 删除 |  |

## X. 实现边界与平台选择（不是新增功能）

这些决定会影响前面所有条目的工作量。未明确的项目保持“待定”。

| 编号  | 决策项           | 可选范围                                | 当前决定 |
| --- | ------------- | ----------------------------------- | ---- |
| X01 | 桌面平台 | Windows / macOS / Linux，可多选并指定首发平台 | Windows 10 及以上（x64）；具体最低系统版本号待验证 |
| X02 | CPU 架构 | x64 / ARM64，按平台选择 | x64 |
| X03 | 应用自身的 Node 依赖 | 完全移除 / 暂时保留独立后台 | Go 承担应用后台；是否附带 Node 运行时待依赖评估 |
| X04 | 前端实现 | 复用现有 React / 重构现有前端 / 重建前端 | 优先复用 React；保留功能界面与原有保持一致 |
| X05 | 旧版 Orca 数据 | 无需兼容 / 一次性导入 / 持续兼容 | 无需兼容 |
| X06 | 旧版远程与移动协议 | 不兼容 / 有限兼容 / 持续兼容 | 无需兼容 |
| X07 | 浏览器替代方式 | 删除 / 系统浏览器 / 独立受控 Chromium / 保留内嵌能力 | 有条件保留内嵌能力；技术不可行时允许移除，联动 K01–K15、Q05 及引用入口 |
| X08 | 桌面退出策略 | 结束所有任务 / 保留后台任务 / 用户选择 | 与原有一致；关闭窗口、退出桌面、停止后台的语义待基线取证 |
| X09 | 第三方云依赖 | 不接入 / 使用上游服务 / 自建替代服务 | 不接入 |
| X10 | 分发方式 | 本地自行构建 / 安装包 / 自动更新 / 应用商店 | 暂定本地打包、手动安装；本轮先移除应用内自动更新与预发布更新入口 |

说明：X03 将应用运行时、前端开发/构建工具链及第三方 Agent/MCP 运行时分开评估。复用 React 所需的 Node 构建工具不等于用户运行打包应用必须安装 Node。X03 不包含第三方 Agent 自身的运行时。即使应用自身完全使用 Go，用户选择的 Agent 仍可能依赖 Node、Python 或其他环境。

本轮补充：移除整个语音模块 T01–T04（T05/T06 宠物原已删除）、U06/U07、U11；U10 收缩为本地崩溃资料查看与导出，反馈上传全部移除。未承诺恢复日期，未来恢复需重新确认范围与验收。

## 裁剪时需要联动核对的依赖

| 选择 | 需要一并核对的能力 | 说明 |
| --- | --- | --- |
| 保留终端 Agent | C、D、V | 启动、输入输出、状态和进程清理需要形成闭环。 |
| 保留关闭窗口后继续运行 | V01–V05、V09–V13、X08 | 独立后台、附着和恢复不能只保留界面入口。 |
| 删除全部内嵌浏览器 | K、Q05、M14、B11、X07 | 链接可以改为系统浏览器；Design Mode、内嵌预览和页面自动化要分别决定。 |
| 保留 HTML/PDF/文档预览 | H、X04 | 文件预览与任意网页浏览不是同一能力，不应直接一起删除。 |
| 删除结构化聊天 | E01–E07、M10 | 仍可通过终端使用 Agent；历史检索与恢复可以独立保留。 |
| 删除账号托管 | F01–F07、U02–U04 | 可以让用户在 Agent CLI 自行登录；应用云账号与 Agent 账号要分开决定。 |
| 删除 Git 写操作 | I05–I11、J 的相关操作 | Diff 阅读、文件编辑和外部 Git 命令仍可保留。 |
| 删除远程访问 | L、M、N13、O02、O08–O13 | 本地终端、普通编排和本地定时任务不必随之删除。 |
| 删除移动端 | M01–M02、M09–M15 | Web 客户端、远程服务、认证与中继是否保留，仍需单独选择。 |
| 删除编排 | N、Q07、D 的相关状态联动 | 多个 Agent 并行终端不依赖完整任务 DAG。 |
| 删除插件系统 | P09–P13 | Skills 与 MCP 是另外的能力，不应自动一起删掉。 |
| 删除自动更新 | U06–U07、X10 | 不影响构建安装包，但需要确定手动升级方式。 |
| 完全移除应用 Node 后台 | X03、V04–V05、K、L、P | 终端仿真、浏览器后端及其他 Node 实现需要替代；Wails 换壳本身不会完成这些工作。 |
| 保留公共产物或私有技能分享 | H11–H13、P05–P07、U02、X09 | 通常需要账号、服务端存储与访问控制配套。 |
| 保留凭据或远程访问 | F12、M08、V13 | 不应把保护凭据和认证误删成单纯附加功能。 |

## 选择结果记录

本节及各表以本轮补充决定为准；历史 240/112 统计已更新。用户的“公开产物等”按此前讨论的产物发布、私有 Skills 分享、组织管理与跨 Profile 转移关联范围落实。

已按用户历次指示记录：先执行指定删除与保留，再将其余 A–W 条目设为保留，本轮进一步移除远程、跨主机、公开分享及本地 Docker 等能力。`u1` 归一化为 `U01`；兼容要求归并为 X05、X06。

- 技术目标：移除 Electron，采用 Go + Wails。
- 功能统计：**217 项保留，135 项删除，0 项待定**（352 项中含 40 个 Agent 适配条目）。
- 保留规则：除下列删除项外，A–W 其余保留；N13、O02、V14 仅保留本地部分，K01–K15 与 Q05 有条件保留，U10 仅本地导出；J 组仅保留 J16（自部署 Jira，不支持 Jira Cloud）；W 组仅保留 W01（Claude Code）、W03（Codex）、W06（OpenCode）、W07（Pi）。
- 删除规则：C17、D02；F01–F11；H11–H13；J 除 J16 外全部；K16–K18；L、M、R 全组；O08–O13；P05–P07；T01–T06；U01–U04、U06、U07、U11；W 除上述四项外全部。
- 后续版本再做：未指定，不能自动将已保留功能降为后续版本。
- 本轮真实 Agent 验证仅使用本地 Codex、Pi；记录版本、路径及能力。Claude Code、OpenCode 的保留决定不变，仅做有来源的适配合同/日志回放检查；未真实运行的能力不得宣称真实验收通过。
- Jira 部署边界：仅支持自部署实例；Jira Cloud 不纳入范围。
- 已确定实现边界：X05 旧版数据无需兼容；X06 旧版远程与移动协议无需兼容；X07 内嵌浏览器有条件保留；X09 不接入第三方云服务。
- 本轮实现决定：X01 Windows 10 及以上；X02 x64；X03 Go 承担应用后台，附带 Node 与否待依赖评估；X04 优先复用，保留界面保持一致；X08 保持原退出策略并采集旧版行为；X10 暂定本地打包。
- 本地代码：`D:\Study\orca`，Fork 为 `RookieRoll/orca`；本表记录范围决策，代码实施及验证状态按对应任务交付记录维护。

## 实施状态记录

- **B3-ACCOUNT：已交付。** F01–F03、F05–F07 的应用托管账号入口已移除；F04 专用提供商集成余项仍待 B6 对应 W 闭包处理。F12 系统凭据保护与 Agent CLI 自有登录保留。
- **B3-USAGE：代码与静态审查完成。** F08–F11 的提供商额度、重置、历史用量及自动化 token/成本汇总已移除；DEP07 本地工作活动、CPU/RAM/进程信息、Agent context token 与运行时限流错误处理保留。
- 静态检查：304 个已删除生产模块、20,795 个候选引用检查，0 个悬空引用及解析错误；204 个存活改动 TS/TSX、11 个 JSON/JSONC、208 个已删除测试与 timing 对照均通过对应检查；无空文件，`git diff --check` 通过。
- 定向测试：`automation-usage-summary.test.ts`、`automation-list-scope.test.ts`、`automation-list-response.test.ts`、`resource-memory-metric-copy.test.ts` 共 43 项通过。完整测试集、typecheck、TC、build、E2E 及 Codex/Pi 实机验收未运行。

### 已选范围的依赖冲突与实现边界

以下记录按本轮决定解决的依赖冲突及仍需协调的实现边界；已解决的范围冲突不等于功能已实现或通过验收。

| 编号 | 关联项 | 当前决定与待协调内容 |
| --- | --- | --- |
| DEP01 | J16、F、X09 | 仅保留自部署 Jira，不支持 Jira Cloud，与不接入第三方云服务的边界一致。实例地址配置和认证来源仍待实现方案确定；不恢复 F 组账号托管功能。 |
| DEP02 | W01/W03/W06/W07、D/E、D02、F | 四种 Agent 的其余适用接入能力保留，安装引导及账号/用量托管删除。聊天、历史恢复和状态支持需按各 Agent 的实际接口实现；W 表中的上游 auto-setup、usage、hot-swap 描述不覆盖已删除决定。 |
| DEP03 | K16/K17、L/M | 已解决：移除远程浏览器及 SSH 路由；本地内嵌浏览器有条件保留，需原型验证。 |
| DEP04 | H11–H13、K18、P05/P06、U03/U04 | 已解决：移除公开产物及其列表/链接、浏览器产物分享、私有 Skills 分享与包撤销、组织管理及跨 Profile 转移；本地文件预览、Skills 安装和插件版本管理仍保留。 |
| DEP05 | N13、O02/O08–O13、P07、V14、L/M | 已解决：移除跨主机/WSL/云执行和本地 Docker；O08–O13 专用隔离环境能力删除，P07 删除；N13 仅本地子 Run，O02 仅本机，V14 仅本地协商。本地编排与定时任务保留。 |
| DEP06 | V01–V05/V13、L11、X08 | 本地独立 daemon、桌面退出后继续运行、重新附着及本地 RPC 均保留；删除远程 serve 不删除这些本地能力。X08 的具体退出交互应满足 V02 的后台继续运行要求。 |
| DEP07 | S08、F11 | 使用统计概览保留，账号用量和成本估算删除；统计口径需收缩到与 F 组不重叠的工作活动等能力。 |
| DEP08 | P11、Q、R、W02、O08–O13 | 通用插件和 CLI 保留；模拟器、模拟器专用技能、Claude Teams 专用适配及已删除隔离环境的 Recipe 执行入口不恢复。 |
| DEP09 | U06/U07、X10 | 已解决：本轮先移除自动更新及应用内本地构建/预发布更新入口；分发暂定本地打包、手动安装，不影响开发者构建。 |

## 证据和覆盖说明

本次核对的主入口包括：

- `README.md`：产品定位与主要用户工作流。
- `docs/site/content/docs/`：功能文档及设置参考。
- `src/preload/index.ts` 与 `src/preload/api/`：桌面暴露的业务能力。
- `src/renderer/src/components/`：界面功能域与设置入口。
- `src/main/`：运行时、浏览器、终端、集成、编排及平台模块。
- `src/packages/process-host/`：进程生命周期与执行能力。
- `mobile/app/` 与 `mobile/src/`：移动端和共享客户端入口。
- `cloud/`：中继及相应云服务配套。
- `native/`：平台原生辅助能力。

功能清单不承诺移植全部内部补丁。裁剪完成后，应对保留项建立新的验收行为，再决定哪些上游兼容细节需要保留。第三方平台 API、账号服务和 Agent 版本也需要在实现阶段重新核对。

## 配套验收文档

[Orca 保留功能验收矩阵（Go + Wails）](Orca%20保留功能验收矩阵（Go%20%2B%20Wails）.md)：覆盖 216 项保留功能与 136 项删除功能反向检查，定义操作、预期、证据和范围冲突；当前均未执行。
