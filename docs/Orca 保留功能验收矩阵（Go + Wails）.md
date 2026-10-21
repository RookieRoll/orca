# Orca 保留功能验收矩阵（Go + Wails）

> 日期：2026-10-21。状态：验收设计稿，未采集旧版截图、未运行新旧对比测试；不是功能通过报告。

## 1. 范围、基线与完成定义

- 范围来源：[功能裁剪清单](Orca%20功能裁剪清单（Go%20%2B%20Wails）.md)。A–W 共 216 项保留、136 项删除；本矩阵保留原编号，不擅自调整用户决定。
- 本地基线仓库：`D:\Study\orca`，Fork：`RookieRoll/orca`，基线提交：`e2196403c397b44964f6ec80b93a3cfee27aa0df`。
- 目标：保留功能的界面结构、交互和可观察业务结果一致；删除功能的专用入口消失。Wails/Go 可采用不同内部实现。
- 明确边界：目标 Windows 10 及以上（x64），具体最低系统版本号待技术验证锁定；不兼容旧版数据和旧版远程/移动协议；移除远程、跨主机、公开分享及本地 Docker；内嵌浏览器有条件保留；不接入第三方云服务；Jira 仅支持自部署。
- 本文每项是拟执行的最小行为合同。候选入口和预期仍需旧版实测记录；不能把本文的描述直接当作旧版已经验证的行为。
- “一致”不要求新旧数据库格式、内部类名、RPC 名、绝对路径、随机 ID 或进程号相同；要求路径/ID 映射、归属和生命周期正确。例如同一新版终端重连前后必须证明会话连续性。
- 上游存在的缺陷不自动成为兼容要求。实测发现缺陷时单列记录，明确目标行为后再定验收结果。

前端优先复用，保留功能界面与原有保持一致；退出策略保持一致，关闭窗口/退出桌面/停止后台行为需分别采基线。Go 承担应用后台，Node 是否附带待依赖评估；前端构建及第三方 Agent/MCP 运行时分别记录。分发暂定本地打包、手动安装；整个语音模块、反馈上传、遥测和自动更新本轮先移除。U10 仅保留本地崩溃资料查看与导出。

### 状态定义

| 状态 | 含义 |
| --- | --- |
| 未执行 | 已定义用例，尚未采集旧版证据，也未运行新版。 |
| 阻塞 BLOCK-xx／未执行 | 功能仍保留，但与已删除依赖或实现边界冲突；不得静默跳过或算通过。 |
| 已采基线 | 旧版操作、输入、截图与业务结果已有可追溯记录。 |
| 新版失败 | 实际执行后存在未接受的视觉/功能差异。 |
| 已通过 | 在指定平台、构建、夹具和边界下执行，通过所需断言并保存证据。 |

216 项不是 216 个测试脚本。每项可展开多个正常、异常和恢复用例，下面只定义最低覆盖；共享脚本可以覆盖多项，但必须记录对应编号。

## 2. 基线采集和差分规则

1. 旧版与新版使用独立配置目录及两个等价、可重建的工作区副本；不共享数据库、锁、活终端或 Git 工作目录，避免相互干扰。
2. 每次记录提交/构建、平台/架构、系统 WebView 版本、窗口客户区尺寸、DPI、缩放、主题、字体、语言、Agent 版本及夹具哈希。
3. UI 截图仅比较当前用例保留的控件区域；删除入口造成的布局收缩要有审阅过的目标截图，不能将旧截图机械设为逐像素真值。
4. 同平台同条件比较布局和交互。字体抗锯齿、原生菜单及系统标题栏可有经记录的差异；文本截断、焦点错误、点击目标偏移、内容丢失不可用“渲染差异”豁免。
5. 有限屏蔽时间戳、光标闪烁及随机标记；不能屏蔽整段终端、错误提示或用户正文。数据比较只归一化明确的路径、时间、端口、ID，保留映射一致性。
6. 先用确定性假 Agent 和录制流比较，再仅用本地 Codex、Pi 做真实 Agent 冒烟。Claude Code、OpenCode 仅做有来源的适配合同/日志回放检查，未真实运行的能力不宣称真实验收通过。模型随机回答不作为新旧等价断言；比较提示词/附件、进程参数、事件归属和恢复行为。
7. Go 单元测试验证领域逻辑，前端/接口测试验证适配合同，端到端测试验证用户结果；避免只测试 mock 返回值或内部状态。
8. 上游 Electron 基线运行遵守仓库 `AGENTS.md`：`ORCA_BACKGROUND_LAUNCH=1`，隐藏窗口用 CDP 取证；原生焦点、输入法、提权、系统通知、Computer Use 在隔离桌面或 CI 验证，不抢占用户桌面。
9. 新版不假设 Electron CDP 驱动继续可用。先验证目标 Wails/WebView 的可驱动能力；自动化不可覆盖的原生操作使用有证据的隔离人工验收，不能标为自动通过。

## 3. 共享测试夹具（定义，尚未创建）

| 编号   | 准备内容                                                                              | 独立核验方式                                                              |
| ---- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| FX01 | 独立配置目录；固定主题/字体/语言；三档客户区建议 1440×900、1024×768、800×600，DPI 100%/150%/200%，按目标平台可用值记录 | 保存环境清单；尺寸是拟测条件，不是现有产品最低尺寸承诺。                                        |
| FX02 | 两个仓库、非 Git 文件夹、main/feature/冲突分支、本地 bare origin/upstream、子模块、                     | 用 Git CLI 检查 refs、index、status、worktree list、文件哈希；固定作者和时间，避免外部托管平台。 |
| FX03 | 中文/空格/特殊字符路径；UTF-8/CRLF；符号链接；Markdown/HTML/Mermaid/PDF/图片/CSV/Notebook；只读与外部修改样本  | 预存字节哈希及预期解析数据，不用截图代替磁盘内容验证。                                         |
| FX04 | 真实 PTY；确定性 ANSI/TUI 回放；中文宽字符/Emoji/备用屏幕/光标/OSC/尺寸报告；持续高输出及延迟回显程序                  | 记录原始字节、输入序列、屏幕网格、模式和进程存活证明。                                         |
| FX05 | 记录 argv/cwd/env/提示词/附件的假 Agent；可控工作/问题/完成/失败事件；父子进程；重复/乱序/迟到事件                    | 外部记录和进程证据为判据；仅固定本地 Codex、Pi 的版本做真实冒烟；其余保留适配使用有来源的合同/回放样本。                                |
| FX06 | 四种保留 Agent 各自受支持的历史/聊天日志；空、损坏、父子会话和跨项目记录                                          | 对照原日志及各 Agent 能力，不能编造 Pi/OpenCode 的聊天支持。                            |
| FX07 | 本地网页测试站：两种身份、Cookie/storage、弹窗/下载、SPA、source map、元素定位、滚动、缩放、故障页                   | 服务端请求日志、文件哈希和 DOM 事实；不使用公网真实账号。                                     |
| FX08 | 专用自部署 Jira 测试项目；固定任务/字段/权限；可撤销测试写操作和故障代理                                          | 自部署实例 API/审计日志；响应回放覆盖故障，真实实例覆盖兼容，禁止操作生产项目。                          |
| FX09 | 可控调度时钟；本机计划记录；假 Agent 与本地进程事件 | 验证实际触发次数、时间、会话复用与进程归属；无 Docker/云/远程环境。 |
| FX10 | 本地 Git 插件市场、v1/v2/坏版本包、技能目录、stdio MCP 假服务、脚本输出和错误                                 | 文件哈希、进程日志、访问范围和停用后零执行证据。                                            |
| FX12 | 本地代理测试端点、断网/超时；故障配置副本和可清缓存；脱敏崩溃样本 | 请求日志、本地导出文件哈希及恢复证据；确认无录音/转写、反馈上传、遥测或应用更新请求。 |

所有破坏性、删除、Git 写、进程终止、更新和系统操作仅在夹具/隔离环境执行。敏感原始数据不进入验收产物。

## 4. 对比方法与证据编码

| 编码 | 判据 |
| --- | --- |
| VIS | 旧版与新版截图、交互录像、控件几何及焦点；图片差分辅助审阅，数值容差在基线后确定。 |
| FLOW | 相同用户动作和键盘/拖放顺序的端到端结果。 |
| FS | 磁盘路径、文件字节、编码、链接、权限及句柄释放。 |
| GIT | Git CLI 的 refs、status、index、diff 和 commit/tree 结果。 |
| PTY | 原始终端流、解析网格、模式、尺寸和交互回显；不能只比较网页 DOM。 |
| PROC | 进程归属、启动参数、退出/持续运行、子树清理与无重复启动证明。 |
| API | 领域 API 的输入、输出、错误和副作用合同；允许传输实现变化。 |
| STATE | 从用户可观察状态及持久结果验证一致性，不强制新旧内部 schema 相同。 |
| REPLAY | 确定性事件、日志和分片回放，覆盖重复、乱序、过期和恢复。 |
| WEB | 指定网页的 DOM、Cookie/storage、页面身份和输入结果。 |
| NET | 受控请求/响应日志；用于确认目标、取消、离线以及禁止的出站访问。 |
| CLOCK | 可控时间、时区、睡眠/唤醒及调度触发次数。 |
| CLI | 外部进程实际调用、stdout/stderr、退出码和真实副作用。 |
| OS | 隔离原生环境的权限、输入法、剪贴板、通知、快捷键、窗口和系统行为。 |

统一证据目录建议：`acceptance/<case-id>/<platform>/<build>/`，保存 `environment.json`、步骤记录、新旧截图、脱敏日志、预期/实际结果和差异说明。这是拟定目录规范，本次未生成执行证据。

## 5. 216 项保留功能验收矩阵

每行用例 ID 为 `ACC-<原编号>`；编号与功能清单一一对应。组级夹具适用于该组，具体入口是候选入口，最终名称和点击路径应随旧版录制补充。K01–K15 与 Q05 有条件保留：先验证内嵌浏览器可行性；若移除，须联动删除相关入口并更新用例与统计，不能静默跳过。每项默认还需覆盖：取消不产生副作用、重复操作不误重复执行、失败可见且不伪成功、切换工作区不串目标。

### A. 项目、仓库与工作区（20 项）

共用夹具：FX01、FX02、FX03。

证据入口：[worktrees.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/worktrees.mdx)、[worktrees-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/worktrees-bridge.ts)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-A01：添加本地 Git 仓库 | 添加项目/仓库入口 | 添加已存在仓库，再重复添加；退出后重开 | 路径和仓库识别正确，重复项按基线处理，项目仍可进入。 | VIS + FS + GIT | 未执行 |
| ACC-A02：克隆仓库 | 添加项目/克隆入口 | 从本地 bare 仓库克隆，再使用无效地址重试 | HEAD、remote 和文件正确；失败不留下伪成功项目，不影响已有项目。 | VIS + FS + GIT | 未执行 |
| ACC-A03：普通文件夹工作区 | 打开文件夹 | 打开非 Git 目录，编辑文件并运行命令 | 可编辑和执行；不错误创建 Git 仓库，不显示误导的 Git 状态。 | VIS + FS + GIT | 未执行 |
| ACC-A04：项目分组与多仓库项目 | 项目分组 | 建立两个仓库项目组，重排并切换仓库 | 分组和顺序正确持久化；文件、终端和设置不串到其他仓库。 | VIS + FS + GIT | 未执行 |
| ACC-A05：Git worktree 创建 | 新建工作区 | 从固定提交创建 worktree，在其中修改文件 | git worktree list、分支和目录一致；主检出内容不被更改。 | VIS + FS + GIT | 未执行 |
| ACC-A06：起始引用选择 | 创建工作区/起始引用 | 分别从本地分支、远程分支和 SHA 创建，再输入不存在引用 | 实际基点与所选提交一致；非法引用失败且无遗留工作区。 | VIS + FS + GIT | 未执行 |
| ACC-A07：后台创建工作区 | 创建工作区进度 | 运行延迟初始化，同时切换已有工作区并输入 | 创建进度可见；其他工作区可操作，完成/失败只落到目标工作区。 | VIS + FS + GIT | 未执行 |
| ACC-A08：分支命名与命名前缀 | 创建工作区/命名 | 设置前缀后创建；测试中文、冲突名和非法分支字符 | 最终分支符合 Git 规则；冲突和错误提示明确，不覆盖现有分支。 | VIS + FS + GIT | 未执行 |
| ACC-A09：工作区名称、图标与 Emoji | 工作区卡片/属性 | 修改名称和 Emoji，切换再重开应用 | 新名称和图标一致显示，不把展示名错误写为文件路径。 | VIS + STATE | 未执行 |
| ACC-A10：工作区列表、排序与过滤 | 侧边栏列表 | 设置顺序和休眠/默认分支过滤，关闭过滤后搜索 | 排序、可见项及搜索跳转正确；删除的远程来源选项不残留。 | VIS + STATE | 未执行 |
| ACC-A11：父子工作区展示 | 父子工作区导航 | 建立有父子关系的工作区，展开/收起后重新进入 | 层级、选中项和子项计数正确，不隐藏仍运行的任务状态。 | VIS + STATE | 未执行 |
| ACC-A12：工作区看板 | 工作区看板 | 打开看板并选择不同状态的工作区 | 卡片内容、筛选和跳转目标一致，不出现已删除产品入口。 | VIS + STATE | 未执行 |
| ACC-A13：共享目录和忽略文件复制 | 仓库共享路径设置 | 配置共享目录与忽略文件，创建新 worktree，再更新源内容 | 复制/链接语义按基线；不越界写入，不共享不应共享的文件。 | VIS + FS + GIT | 未执行 |
| ACC-A14：稀疏检出预设 | 稀疏预设设置 | 选择子目录预设创建工作区，再切换预设 | sparse-checkout 结果正确，未选目录不意外拉出；原仓库不被破坏。 | VIS + FS + GIT | 未执行 |
| ACC-A15：工作区创建与启动钩子 | orca.yaml/工作区创建 | 运行写标记的初始化与启动 Hook，再测试失败和取消 | 执行次数、目录、顺序和失败行为可核对；取消不重复执行。 | VIS + FS + GIT | 未执行 |
| ACC-A16：关闭、删除与清理工作区 | 工作区菜单/删除 | 取消一次删除再确认删除有专用子进程的工作区 | 取消无副作用；确认只清理目标目录和归属进程，不误删其他工作区。 | VIS + FS + GIT | 未执行 |
| ACC-A17：保留未合并分支检查 | 资源管理/保留分支 | 构造有未合并提交的分支，删除 worktree 后检查保留分支 | 不丢失未合并提交；提示、保留与后续清理结果和基线一致。 | VIS + FS + GIT | 未执行 |
| ACC-A18：空间占用分析与资源管理 | 空间/资源管理 | 扫描固定大小目录，取消后重扫并清理选中项 | 占用口径可解释；取消结束扫描，清理不越过选中目录。 | VIS + FS + GIT | 未执行 |
| ACC-A19：工作区检查点 | 工作区检查点入口/CLI | 写入两次不同阶段检查点，再读取并重新进入工作区 | 内容、所属工作区和更新顺序正确；不串到其他任务。 | VIS + STATE | 未执行 |
| ACC-A20：仓库级 orca.yaml 配置 | 仓库配置文件 | 分别加载有效、无效和带未知字段的 orca.yaml | 保留字段生效，解析错误可定位；已删除远程能力不被配置重新开启。 | VIS + STATE | 未执行 |

### B. 窗口、布局与导航（12 项）

共用夹具：FX01、FX02、FX04。

证据入口：[tabs-panes-splits.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/tabs-panes-splits.mdx)、[quick-open.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/quick-open.mdx)、[settings.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/settings.mdx)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-B01：多标签页 | 标签栏 | 交替打开文件、终端和网页，切换后关闭其中一个 | 活动内容、关闭目标和相邻选中逻辑一致；终端不会因切换重建。 | VIS + FLOW + STATE | 未执行 |
| ACC-B02：水平与垂直分屏 | 面板分屏 | 连续横向和纵向分屏，再改变窗口尺寸 | 面板排列、最小尺寸和内容归属正确，无遮挡和不可达区域。 | VIS + FLOW + STATE | 未执行 |
| ACC-B03：拖拽分屏与标签移动 | 标签拖拽 | 重排标签、跨组移动并拖至边缘创建分屏 | 标签只出现一次，焦点和内容随移动，拖拽取消不丢失内容。 | VIS + FLOW + STATE | 未执行 |
| ACC-B04：标签组与固定布局边界 | 标签组/边界 | 建立多组面板，调整并固定边界后切换工作区 | 边界约束和组内顺序正确，恢复时比例无意外漂移。 | VIS + FLOW + STATE | 未执行 |
| ACC-B05：最近标签切换 | 标签快捷切换 | 按固定顺序访问三种标签，执行最近/同类/全类切换 | 按基线的访问顺序和类型规则切换，焦点落在目标内容。 | VIS + FLOW + STATE | 未执行 |
| ACC-B06：快速打开和全局命令入口 | 快速打开/命令入口 | 搜索同名文件、工作区、Agent 与命令并选择结果 | 结果类型可辨认，选择准确，键盘导航有效；无删除功能结果。 | VIS + FLOW + STATE | 未执行 |
| ACC-B07：新标签统一输入框 | 新标签输入框 | 分别输入文件名、命令、URL 和普通搜索词 | 解析、候选和打开位置按基线；文字不被错误当作可执行命令。 | VIS + FLOW + STATE | 未执行 |
| ACC-B08：侧边栏与状态栏 | 侧边栏/状态栏 | 切换任务状态和工作区，收起侧栏并调整窗口 | 选中态、计数和状态同步；已删除账号用量区不再占位。 | VIS + FLOW + STATE | 未执行 |
| ACC-B09：多窗口与面板弹出 | 弹出窗口入口 | 将支持面板弹出，主窗和子窗分别切换/关闭 | 内容和归属正确，事件无重复处理；焦点行为需原生环境复验。 | VIS + FLOW + STATE | 未执行 |
| ACC-B10：浮动工作区 | 浮动工作区 | 打开浮动终端、浏览器和 Markdown，切换主工作区 | 浮动内容不绑定到错误仓库；快捷开关与会话保存正确。 | VIS + FLOW + STATE | 未执行 |
| ACC-B11：外部编辑器与系统打开 | Open in/系统打开 | 打开文件、目录和已配置编辑器，测试程序不存在 | 路径传递准确且不解释为 Shell 代码；失败可见，不错误打开其他目标。 | VIS + FLOW + STATE | 未执行 |
| ACC-B12：布局和窗口状态恢复 | 窗口/布局恢复 | 建立多面板布局后退出重开，再改变可用显示区域 | 恢复活动标签及合理边界；不在屏幕外留下不可操作窗口。 | VIS + FLOW + STATE | 未执行 |

### C. 终端基础交互（19 项）

共用夹具：FX01、FX04。

证据入口：[terminal.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/terminal.mdx)、[pty-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/pty-bridge.ts)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-C01：本地交互式终端 | 新建终端 | 在带中文与空格的目录运行回显、读写和退出命令 | cwd、环境、退出状态与输出正确；终端不会启动到其他目录。 | VIS + PTY | 未执行 |
| ACC-C02：多个终端与终端标签 | 终端标签 | 打开三个终端，分别设置环境和输出唯一标记 | 会话独立，输入和输出不串流，关闭一项不结束其他会话。 | VIS + PTY | 未执行 |
| ACC-C03：终端分屏 | 终端分屏 | 建立四个终端面板，依次输入并切换焦点 | 命令只到目标面板；尺寸、焦点和滚动位置分别维护。 | VIS + PTY | 未执行 |
| ACC-C04：Shell 选择与启动参数 | 设置/终端 Shell | 选择有效自定义 Shell 与参数，再配置不存在路径 | argv 和 Shell 身份正确；失败提示包含有效原因，不静默换错环境。 | VIS + PTY | 未执行 |
| ACC-C05：Shell 启动环境继承 | 终端环境 | 从带自定义 PATH 和启动标记的登录环境启动 | 预期工具可发现，启动文件执行次数可核对，无重复污染 PATH。 | VIS + PTY | 未执行 |
| ACC-C06：Windows PowerShell 与 Git Bash | Windows Shell 设置 | 分别启动 PowerShell、pwsh 和已安装 Git Bash | 实际进程和参数正确；未安装项可识别，无可见辅助控制台闪现。 | VIS + PTY + OS | 未执行 |
| ACC-C07：Windows 管理员终端 | Windows 管理员终端 | 在隔离桌面同意和拒绝提升请求各一次 | 权限与选择一致；拒绝不伪装成功，不提升其他终端。 | VIS + PTY + OS | 未执行 |
| ACC-C08：终端输入、粘贴与选择复制 | 终端输入区域 | 输入中文、组合键和多行文本，选择复制后粘贴 | 字符、换行及剪贴板内容正确；输入法组合串不重复提交。 | VIS + PTY + OS | 未执行 |
| ACC-C09：OSC 52 剪贴板 | 终端剪贴板设置 | 启用/禁用 OSC 52，重放同一受控写剪贴板序列 | 启用按基线写入；禁用不改剪贴板，重放快照不重复触发副作用。 | VIS + PTY + OS | 未执行 |
| ACC-C10：终端搜索 | 终端查找 | 输出重复关键字，前后搜索并关闭搜索栏 | 匹配和滚动定位正确；退出后输入回到终端，不吞快捷键。 | VIS + PTY | 未执行 |
| ACC-C11：终端链接与文件位置跳转 | 终端路径/URL | 输出中文文件路径、行列号和受控网页链接并点击 | 文件定位准确，网页路由正确，不把标点纳入路径。 | VIS + PTY | 未执行 |
| ACC-C12：链接操作菜单与路由 | 终端链接菜单 | 切换默认打开策略，再用修饰键执行一次相反路由 | 只打开所选目标一次，菜单和修饰键行为符合基线。 | VIS + PTY | 未执行 |
| ACC-C13：复制终端上下文 | 复制上下文入口 | 输出 ANSI 颜色、提示符与多行内容后复制上下文 | 复制范围和去控制序列规则与基线一致，不混入其他会话。 | VIS + PTY | 未执行 |
| ACC-C14：终端字体、光标和滚动设置 | 设置/终端外观 | 更改字体、间距、光标和滚动参数再重开 | 配置生效并持久化；光标与字符网格无错位。 | VIS + PTY | 未执行 |
| ACC-C15：终端颜色主题 | 设置/终端主题 | 切换明暗主题并输出 ANSI 标准色和真彩色样本 | 文字可读，颜色角色和终端背景符合主题，不遗漏选中/搜索颜色。 | VIS + PTY | 未执行 |
| ACC-C16：Ghostty 主题与配置导入 | Ghostty 导入 | 导入固定主题及含无效字段的配置 | 支持字段映射和错误提示可核对；不引入已删除的 Warp 导入入口。 | VIS + PTY + OS | 未执行 |
| ACC-C18：终端渲染模式与性能设置 | 终端渲染设置 | 切换可用渲染模式，加载固定输出并模拟渲染器失效 | 文字内容相同，有可用回退或明确错误，不出现永久空白。 | VIS + PTY | 未执行 |
| ACC-C19：终端快捷命令 | 快捷命令 | 保存一个仅粘贴命令与一个立即运行命令并调用 | 内容、目标和回车策略正确，不把仅粘贴项直接执行。 | VIS + PTY | 未执行 |
| ACC-C20：终端尺寸变化 | 终端窗口尺寸 | 运行报告尺寸和全屏 TUI 的程序，反复调整分屏 | PTY 行列与可用区域一致，光标/换行无持续错位，进程未重启。 | VIS + PTY | 未执行 |

### D. Agent 启动、控制与状态（14 项）

共用夹具：FX01、FX02、FX05。

证据入口：[supported.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/supported.mdx)、[agents-sessions.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/agents-sessions.mdx)、[hooks-memory.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/hooks-memory.mdx)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-D01：Agent 发现与可用性检测 | Agent 选择器 | 仅安装四种保留 Agent 中部分，刷新检测 | 路径和可用状态真实；不展示被删提供商或安装引导。 | VIS + PROC + API | 未执行 |
| ACC-D03：默认 Agent | 默认 Agent 设置 | 设置默认 Agent 后分别新建标签和工作区 | 新会话选择正确，已有会话不被替换，设置重开后仍在。 | VIS + PROC + API | 未执行 |
| ACC-D04：自定义 Agent 命令 | 自定义命令 | 配置受控假 Agent 和带空格参数，启动后输出 argv | 参数、cwd 和环境准确；不得因支持自定义命令恢复被删的专用集成。 | VIS + PROC + API | 未执行 |
| ACC-D05：启动提示词与启动选项 | Agent 启动表单 | 传入多行提示词、模型选项及特殊字符后启动 | Agent 收到完整参数和提示词一次，无截断或 Shell 注入。 | VIS + PROC + API | 未执行 |
| ACC-D06：Agent 权限模式 | 权限选项 | 用假 Agent 记录不同权限模式，再测试不支持选项 | 只映射该 Agent 支持的模式，不静默扩大权限。 | VIS + PROC + API | 未执行 |
| ACC-D07：并行启动多个 Agent | 并行启动 | 在独立工作区同时启动四个受控 Agent | 进程和输入输出隔离，任务关联准确，一个失败不阻止其他运行。 | VIS + PROC + API | 未执行 |
| ACC-D08：将文件和图片发送给 Agent | Agent 输入/拖放 | 发送文本、中文路径文件和图片，切换面板后再发送 | 附件归属和内容正确，不发送到之前或其他工作区。 | VIS + PROC + API | 未执行 |
| ACC-D09：继续提问与中断当前任务 | Agent 会话 | 工作中发送中断，再发送后续提示词 | 中断按能力生效；后续输入恰好送达一次，不杀死无关终端。 | VIS + PROC + API | 未执行 |
| ACC-D10：Agent 状态检测 | Agent 状态展示 | 依次注入工作、等待、完成、退出及连接未知事件 | 状态转换与实际事件一致；失联不误判完成，旧事件不覆盖新状态。 | VIS + PROC + API | 未执行 |
| ACC-D11：Agent Hooks | Hooks 设置/运行时 | 开关 Hooks 并注入重复和乱序事件 | 状态正确去重；关闭停止消费对应来源，不依赖被删 WSL 转发。 | VIS + PROC + API | 未执行 |
| ACC-D12：仓库记忆文件 | 项目记忆文件 | 修改约定记忆文件后启动和恢复受支持 Agent | 读取位置和内容符合 Agent 语义；不修改不相关全局配置。 | VIS + PROC + API | 未执行 |
| ACC-D13：Agent 面板与团队会话集成 | Agent 面板 | 显示四种保留 Agent 的会话并切换面板 | 普通 Agent 面板保留；Claude Teams 专用启动/队友入口不出现。 | VIS + PROC + API | 需能力基线／未执行 |
| ACC-D14：Agent 休眠与自动恢复 | 休眠设置/会话 | 令已完成后台任务跨过空闲阈值，再打开面板 | 只有满足条件的任务休眠，恢复原会话；工作中和等待确认的任务不被错误暂停。 | VIS + PROC + API | 未执行 |
| ACC-D15：运行期间保持计算机唤醒 | 保持唤醒设置 | 分别选择持续、工作时和关闭，切换 Agent 状态 | 系统抑制休眠状态与选项对应，退出后释放归属请求。 | VIS + PROC + API | 未执行 |

### E. 聊天界面与历史会话（15 项）

共用夹具：FX01、FX05、FX06。

证据入口：[native-chat.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/native-chat.mdx)、[session-history.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/session-history.mdx)、[ai-vault-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/ai-vault-bridge.ts)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-E01：聊天界面切换（实验性） | 聊天/终端切换 | 对各 Agent 的支持会话来回切换显示方式 | 同一会话内容和输入目标不变；不支持的组合明确标注，不假装通过。 | VIS + REPLAY + STATE | 需能力基线／未执行 |
| ACC-E02：流式消息和工具记录 | 聊天记录 | 重放分片文本、工具调用、结果和失败记录 | 顺序、工具关联和完成状态正确，分片无丢失或重复。 | VIS + REPLAY + STATE | 需能力基线／未执行 |
| ACC-E03：聊天输入框与草稿 | 聊天输入框 | 输入草稿及附件后切换标签并断开/恢复本地连接 | 草稿归属和恢复符合合同，恢复不自动发送。 | VIS + REPLAY + STATE | 未执行 |
| ACC-E04：聊天附件 | 聊天附件 | 添加、移除、重复添加不同类型附件再发送 | 发送集合与可见集合一致；失败或取消不残留悬空附件。 | VIS + REPLAY + STATE | 未执行 |
| ACC-E05：斜杠命令与 Skills 选择 | 聊天斜杠菜单 | 输入斜杠并选择命令/技能，切换 Agent 再查看 | 候选按 Agent 能力过滤；插入和执行行为准确，不泄漏删除的专用技能。 | VIS + REPLAY + STATE | 需能力基线／未执行 |
| ACC-E06：模型、推理强度与会话选项 | 模型/选项控件 | 选择可用模型和推理选项，切换就绪/未启动状态 | 选项传入正确会话；不支持或未就绪时不发送错误控制命令。 | VIS + REPLAY + STATE | 需能力基线／未执行 |
| ACC-E07：结构化问题与权限卡片 | 问题/权限卡片 | 重放结构化问题，提交和取消各一次，并重放旧问题 | 提交恰好对应当前问题，取消不执行，过期卡片不能驱动新任务。 | VIS + REPLAY + STATE | 需能力基线／未执行 |
| ACC-E08：本机会话历史扫描 | 历史面板 | 扫描固定的四种 Agent 日志和损坏/空日志 | 发现符合格式的记录；坏日志不使整个列表失败，不扫描被删提供商。 | VIS + REPLAY + STATE | 未执行 |
| ACC-E09：按项目、目录和 Agent 筛选历史 | 历史筛选 | 混合两个项目与四类 Agent，调整排序和空会话过滤 | 结果集合、顺序和分组准确，不跨配置目录串会话。 | VIS + REPLAY + STATE | 未执行 |
| ACC-E10：历史会话恢复 | 历史恢复 | 从固定日志恢复有中文 cwd 的会话，测试目录不存在 | 恢复命令和会话来源准确，缺失目录有可处理错误，不启动新空会话冒充恢复。 | VIS + REPLAY + STATE | 需能力基线／未执行 |
| ACC-E11：日志打开与恢复命令复制 | 历史菜单 | 复制 ID、路径、恢复命令，并打开原始日志 | 复制值与该记录一致，路径引号可用，不包含其他账号数据。 | VIS + REPLAY + STATE | 未执行 |
| ACC-E12：会话全文搜索与索引 | 历史全文搜索 | 建立索引，搜索中文和工具文本，再关闭并清理索引 | 命中与原始记录对应；关闭/清理后状态正确，取消无无限后台任务。 | VIS + REPLAY + STATE | 未执行 |
| ACC-E13：子 Agent 会话浏览 | 子会话历史 | 导入有父子和缺失父记录的日志并浏览 | 父子关联正确，无无限递归；缺失记录可解释。 | VIS + REPLAY + STATE | 需能力基线／未执行 |
| ACC-E14：历史会话删除 | 历史删除 | 取消和确认删除受控记录，再刷新列表 | 取消不写盘；确认仅删目标日志/索引，不结束无关活会话。 | VIS + REPLAY + STATE | 未执行 |
| ACC-E15：会话标题与自动命名 | 会话标题 | 读取显式标题和缺标题记录，再触发允许的命名 | 标题不串任务，失败有回退；不会重复触发命名请求。 | VIS + REPLAY + STATE | 未执行 |

### G. 文件浏览、代码编辑与搜索（12 项）

共用夹具：FX01、FX02、FX03。

证据入口：[file-explorer.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/editing/file-explorer.mdx)、[monaco.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/editing/monaco.mdx)、[fs-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/fs-bridge.ts)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-G01：文件树 | 文件树 | 展开含中文、隐藏项和符号链接的目录，再折叠重开 | 路径、顺序和图标可核对；不因循环链接无限展开。 | VIS + FS | 未执行 |
| ACC-G02：文件创建、重命名、移动和删除 | 文件树菜单 | 创建、重命名、移动和删除文件，测试重名与取消 | 磁盘结果和编辑器状态同步；错误不覆盖原文件。 | VIS + FS | 未执行 |
| ACC-G03：代码编辑器 | 编辑器 | 打开 UTF-8 中文、CRLF 和无末尾换行文件，修改后重开 | 内容、编码及换行按合同保持，不悄悄重写整文件。 | VIS + FS | 未执行 |
| ACC-G04：语法高亮与编辑辅助 | 编辑器语言能力 | 打开已支持语言样本，使用基线确有的编辑辅助 | 高亮、补全/缩进等已确认能力可用；不把缺失 LSP 能力误列为通过。 | VIS + FS | 未执行 |
| ACC-G05：自动保存 | 编辑器自动保存 | 编辑后等待保存，模拟只读目录和写入失败 | 磁盘内容正确；失败可见，未落盘内容不被标为已保存。 | VIS + FS | 未执行 |
| ACC-G06：文件内查找和替换 | 文件查找替换 | 用中文、重复词和正则执行单次及全部替换并撤销 | 匹配范围、替换数和撤销内容正确，不修改其他文件。 | VIS + FS | 未执行 |
| ACC-G07：跨文件搜索 | 全局搜索 | 搜索中文与带空格路径，执行取消和快速切换查询 | 结果与磁盘匹配，过期查询不覆盖新结果，跳转行列正确。 | VIS + FS | 未执行 |
| ACC-G08：快速文件打开 | 快速文件打开 | 搜索同名不同目录文件，键盘选择一个 | 显示可辨认路径，打开精确目标，不重复创建编辑器标签。 | VIS + FS | 未执行 |
| ACC-G09：文件变更监听 | 文件变更监听 | 外部修改、删除并重建文件，包含编辑器有未保存内容情形 | 更新与冲突提示符合基线，不静默丢失编辑内容。 | VIS + FS | 未执行 |
| ACC-G10：文件与图片拖拽 | 文件拖拽 | 拖入文件树、编辑器和 Agent 输入三类目标并取消一次 | 目标动作可区分，路径/附件准确，取消无副作用。 | VIS + FS | 未执行 |
| ACC-G11：文件位置和外部链接打开 | 文件位置入口 | 通过路径加行列和远程仓库文件 URL 执行定位 | 定位到正确文件；外链只执行允许的系统/内嵌路由。 | VIS + FS | 未执行 |
| ACC-G12：忽略规则与大目录处理 | 忽略规则入口 | 检查被忽略大目录并追加忽略规则后刷新 | Git 与文件树口径一致，只改目标 .gitignore，不自动删除内容。 | VIS + FS | 未执行 |

### H. 文档编辑、预览与产物（10 项）

共用夹具：FX01、FX03、FX07。

证据入口：[markdown.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/editing/markdown.mdx)、[viewers.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/editing/viewers.mdx)、[artifacts](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/renderer/src/components/artifacts)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-H01：Markdown 源码与富文本编辑 | Markdown 标签 | 源码和富文本间切换，编辑中文、代码块和列表后保存 | 语义和磁盘内容符合基线往返规则，不损坏代码块或链接。 | VIS + FS | 未执行 |
| ACC-H02：Markdown 斜杠菜单、表格和目录 | 富文本菜单 | 插入表格、标题、代码块，测试表格键盘移动和目录跳转 | 结构正确，光标可用，保存重开后结构不丢。 | VIS + FS | 未执行 |
| ACC-H03：Markdown 内部链接与 Front matter | Markdown 文档 | 编辑 Front matter，点击内部锚点和相对文件链接 | 元数据可解析，目标正确，非法链接不触发不相关命令。 | VIS + FS | 未执行 |
| ACC-H04：文档审阅注释 | 文档审阅入口 | 选段添加、编辑并删除审阅注释，保存后重开 | 注释范围和所属文件准确，不修改正文为错误内容。 | VIS + FS | 未执行 |
| ACC-H05：HTML 预览 | HTML 文件预览 | 预览带脚本和本地资源的测试页，尝试调用应用接口 | 按预览合同展示资源，非受信内容不能调用 Wails 管理接口。 | VIS + FS | 未执行 |
| ACC-H06：Mermaid 图预览 | Mermaid 预览 | 加载有效及语法错误的图，再修改源码 | 有效图正确更新，错误可见且不使整个编辑器崩溃。 | VIS + FS | 未执行 |
| ACC-H07：PDF 预览 | PDF 预览 | 打开多页中英文 PDF，翻页、缩放并关闭重开 | 页码和内容正确；错误文件可恢复，不残留占用文件句柄。 | VIS + FS | 未执行 |
| ACC-H08：图片预览 | 图片预览 | 打开透明 PNG、JPEG 和较大图片，缩放后切换 | 透明、比例和路径正确，无不可恢复内存增长。 | VIS + FS | 未执行 |
| ACC-H09：CSV 与 TSV 查看 | CSV/TSV 查看 | 打开带引号、分隔符和多行单元格样本 | 列行解析正确，Unicode 和空单元格不丢失，不自动修改原文件。 | VIS + FS | 未执行 |
| ACC-H10：Jupyter Notebook 查看 | Notebook 查看 | 打开含 Markdown、代码、图片结果和坏单元的 Notebook | 已保存内容正确展示，不自行执行内核或请求外部服务。 | VIS + FS | 未执行 |

### I. Git 与源码审阅（17 项）

共用夹具：FX01、FX02、FX05。

证据入口：[git-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/git-bridge.ts)、[diff-viewer.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/diff-viewer.mdx)、[annotate-ai-diff.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/annotate-ai-diff.mdx)、[attribution.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/attribution.mdx)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-I01：Git 状态与变更文件列表 | 源码管理页 | 准备修改、暂存、删除、重命名和未跟踪文件后刷新 | 集合与 git status 对应，重命名路径和计数不误报。 | VIS + GIT + API | 未执行 |
| ACC-I02：工作区与暂存区 Diff | Diff 面板 | 对同一文件构造已暂存和未暂存不同修改，切换视图 | 两类 Diff 内容、行号和新增/删除标记正确。 | VIS + GIT + API | 未执行 |
| ACC-I03：分支、提交与基准比较 | 引用比较入口 | 比较固定分支、提交和基准，交换比较方向 | 文件和行差异与指定方向的 Git 输出一致，切换不残留旧结果。 | VIS + GIT + API | 未执行 |
| ACC-I04：提交历史 | 提交历史 | 浏览含合并与重命名的历史，选择不同提交 | 提交详情与 Git 一致，不因分页漏项或串到其他仓库。 | VIS + GIT + API | 未执行 |
| ACC-I05：暂存与取消暂存 | 源码管理操作 | 单项和批量暂存、取消暂存，再测试路径特殊字符 | index 与预期一致，工作区未暂存内容不丢失。 | VIS + GIT + API | 未执行 |
| ACC-I06：放弃修改 | 放弃修改 | 取消一次再丢弃选定文件，保留其他文件修改 | 只改选定目标；确认语义和不可逆结果可核对。 | VIS + GIT + API | 未执行 |
| ACC-I07：创建提交 | 提交面板 | 暂存固定改动，创建提交，并测试失败的 pre-commit | 成功提交的树/作者/说明正确；Hook 失败无伪成功且保留可恢复修改。 | VIS + GIT + API | 未执行 |
| ACC-I08：Fetch、Pull 与 Push | 远程同步操作 | 使用本地 bare remote 执行 Fetch、Pull、Push，模拟拒绝 | 引用和提交正确；失败可见，不把未推送标为已同步。 | VIS + GIT + API | 未执行 |
| ACC-I09：基准分支更新与 Rebase | 更新/变基入口 | 执行无冲突快进和有冲突 Rebase，检查结果 | 提交关系与预期一致；冲突不会被自动丢弃。 | VIS + GIT + API | 未执行 |
| ACC-I10：Fork 同步 | Fork 同步入口 | 使用 origin/upstream 两个本地 bare 仓库完成同步 | 更新指定上游，不推送到错误 remote，不依赖 GitHub 平台集成。 | VIS + GIT + API | 未执行 |
| ACC-I11：冲突状态与中止操作 | 冲突状态 | 制造 Merge/Rebase 冲突再分别中止 | 状态及文件与 Git 一致，中止恢复对应操作前状态。 | VIS + GIT + API | 未执行 |
| ACC-I12：子模块状态 | 子模块列表 | 创建固定子模块并改变其提交/工作区状态 | 父仓库和子模块状态准确，不误把子模块文件当普通目录写入。 | VIS + GIT + API | 未执行 |
| ACC-I13：Diff 行内评论 | Diff 评论 | 对新增、删除和上下文行添加注释后切换比较 | 行号与侧别正确，评论归属不漂移到其他文件。 | VIS + GIT + API | 未执行 |
| ACC-I14：将审阅意见发送给 Agent | 发送审阅意见 | 添加两条意见并发给选定假 Agent，随后重复点击 | 内容与路径完整，去重策略明确，不发送给其他会话。 | VIS + GIT + API | 未执行 |
| ACC-I15：AI 与人工代码归属标记 | 来源标记 | 重放 Agent 改写，再人工修改相同行并导出元数据 | AI/人工归属与基线合同一致，元数据不自行写入 Git 提交。 | VIS + GIT + API | 未执行 |
| ACC-I16：AI 生成提交信息 | 生成提交说明 | 用确定性假生成器生成，再取消和模拟超时 | 使用正确 Diff，取消/超时不覆盖用户编辑，不自动提交。 | VIS + GIT + API | 未执行 |
| ACC-I17：AI 生成 PR 标题和描述 | 生成 PR 文本 | 从固定 Diff 生成标题/正文，测试取消与人工编辑 | 只生成文本，不恢复 GitHub PR API；已有输入不被迟到结果覆盖。 | VIS + GIT + API | 需能力基线／未执行 |

### J. 代码托管与任务平台集成（1 项）

共用夹具：FX01、FX08。

证据入口：[github-pull-request-api.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/github-pull-request-api.ts)、[github-work-item-api.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/github-work-item-api.ts)、[gitlab-api.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/gitlab-api.ts)、[linear.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/linear.mdx)、[jira.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/review/jira.mdx)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-J16：Jira 自部署集成 | 设置/自部署 Jira、任务入口 | 连接受控自部署实例，检索任务、查看详情并关联工作区；测试 401/403/超时 | 只访问配置的自部署地址，任务键/字段与实例一致；不登录 Jira Cloud，错误无伪成功。 | VIS + API + NET | 需能力基线／未执行 |

### K. 内嵌浏览器与浏览器自动化（15 项）

共用夹具：FX01、FX07。

证据入口：[overview.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/browser/overview.mdx)、[design-mode.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/browser/design-mode.mdx)、[profiles.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/browser/profiles.mdx)、[browser-backend.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/browser/browser-backend.ts)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-K01：工作区内嵌浏览器 | 浏览器面板 | 在两个工作区打开不同测试页，切换并调整布局 | 页面留在应用内，URL/标题与工作区对应，不用系统浏览器冒充内嵌。 | VIS + WEB + NET | 未执行 |
| ACC-K02：地址栏、历史与搜索 | 地址栏 | 输入 URL、普通搜索词及历史前缀，再清理历史 | 候选和目标按基线；网络流量限于允许端点。 | VIS + WEB + NET | 未执行 |
| ACC-K03：浏览器标签和弹窗 | 浏览器标签 | 新建关闭再恢复标签，触发普通与命名弹窗 | 标签/profile 继承正确，弹窗有可管理入口，不丢失返回路径。 | VIS + WEB + NET | 未执行 |
| ACC-K04：导航、刷新与页内搜索 | 浏览器导航 | 在两页间前进后退、软/硬刷新，搜索页内中文 | URL 和历史正确，强刷缓存语义可证明，页内搜索不截获终端快捷键。 | VIS + WEB + NET | 未执行 |
| ACC-K05：下载管理 | 下载入口 | 正常、取消及失败下载固定文件到带空格路径 | 文件哈希与目标一致，取消不伪装完成，未完成文件处理明确。 | VIS + WEB + NET | 未执行 |
| ACC-K06：浏览器身份配置 | 浏览器 profile 设置 | 建立两个浏览器身份，分别登录本地测试站 | 浏览器 profile 与已删除应用 Profile 区分；身份可选并正确持久化。 | VIS + WEB + NET | 需能力基线／未执行 |
| ACC-K07：Cookie 导入与登录辅助 | Cookie 导入 | 向受控测试 profile 导入可支持 Cookie，并模拟格式错误 | 仅导入目标身份，失败不污染原 Cookie；源格式支持须实测。 | VIS + WEB + NET | 需能力基线／未执行 |
| ACC-K08：工作区与 profile 隔离 | 工作区身份隔离 | 在两个 profile 写入 Cookie/storage，交替访问和弹窗 | 隔离边界符合配置，不串登录态；嵌入页面不可调用应用管理接口。 | VIS + WEB + NET | 未执行 |
| ACC-K09：视口与设备模拟 | 设备模拟控件 | 切换固定桌面/移动视口及触摸设置，再恢复 | 页面报告的 viewport/DPR/输入语义正确，恢复后不留移动模式。 | VIS + WEB + NET | 未执行 |
| ACC-K10：开发者调试与页面检查 | 页面调试入口 | 检查受控页面 DOM/日志，开关调试面板再操作 | 调试能力可达且绑定正确页，不损坏自动化或暴露其他工作区。 | VIS + WEB + NET | 未执行 |
| ACC-K11：Design Mode 元素选择 | Design Mode | 启用元素选择，选中嵌套/滚动后的目标后取消 | 高亮位置与目标一致，取消退出选择，不误点击页面业务按钮。 | VIS + WEB + NET | 未执行 |
| ACC-K12：元素 HTML、CSS 与截图提取 | Design Mode 发送 | 选定已知元素，提取 HTML/CSS/裁剪截图并发给假 Agent | 元素、样式和截图对应同一目标，缩放/DPR 下裁剪正确，无错发。 | VIS + WEB + NET | 未执行 |
| ACC-K13：源代码位置关联 | 源码关联 | 在有 source map 的测试页选择元素，再测无映射页 | 有映射定位正确文件行；无映射明确缺失，不伪造位置。 | VIS + WEB + NET | 未执行 |
| ACC-K14：Agent 浏览器自动化 | 浏览器自动化入口 | 对两个页面执行快照、点击、填写和等待，再故意使用过期目标 | 操作绑定指定页面；过期目标失败，不回退到其他页执行。 | VIS + WEB + NET | 未执行 |
| ACC-K15：浏览器截图、录屏/画面流 | 浏览器画面接口 | 对动画/滚动测试页截图及使用已支持画面流，关闭目标 | 截图内容和尺寸正确，订阅结束释放资源，不无限保留帧。 | VIS + WEB + NET | 未执行 |

### N. 多 Agent 编排（14 项）

共用夹具：FX01、FX02、FX05。

证据入口：[orchestration.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/orchestration.mdx)、[orchestration](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/runtime/orchestration)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-N01：Run 运行记录 | 编排入口/CLI | 创建两个 Run，写入消息并重启运行时后读取 | Run 身份和记录持久，消息不跨 Run；无需复用旧版 ID 格式。 | API + STATE + PROC | 未执行 |
| ACC-N02：任务创建与规格 | 任务入口/CLI | 建立带规格任务并更新合法/非法状态 | 规格保存准确，非法状态转换拒绝且不破坏原记录。 | API + STATE + PROC | 未执行 |
| ACC-N03：任务依赖 DAG | 任务依赖 | 建立 A→B→C，再构造环和失败依赖 | 依赖完成前不派发后继；环与不可满足依赖可识别。 | API + STATE + PROC | 未执行 |
| ACC-N04：Worker 派发 | Worker 派发 | 派发到指定本地工作区和 Agent，模拟创建失败 | 只创建一次关联 Dispatch，失败无幽灵 Worker。 | API + STATE + PROC | 未执行 |
| ACC-N05：Dispatch 尝试记录 | Dispatch 记录 | 对同一任务执行首次尝试与重试，提交迟到完成事件 | 尝试独立记录，旧尝试不能结算新尝试。 | API + STATE + PROC | 未执行 |
| ACC-N06：Worker 模型与参数选择 | Worker 选项 | 派发不同模型/推理参数给四种 Agent 的支持组合 | 选项落到正确 Worker，不支持组合明确拒绝。 | API + STATE + PROC | 未执行 |
| ACC-N07：Agent 消息与收件箱 | 消息收件箱 | 发送单播/组播，反复读取后确认消费 | Run 范围、FIFO/重放和 ack 符合合同，不跨 Run 投递。 | API + STATE + PROC | 未执行 |
| ACC-N08：阻塞提问与问答 | Worker 提问 | 发出阻塞问题，先不回答再回复一次并重启读取 | 等待期间任务不误完成，回答准确恢复对应 Worker。 | API + STATE + PROC | 未执行 |
| ACC-N09：Decision Gate | 决策门 | 建立门控依赖，尝试提前派发，再解决决策 | 关闭门时不能推进，解决只释放相应任务。 | API + STATE + PROC | 未执行 |
| ACC-N10：心跳、完成与升级报告 | 执行事件 | 注入心跳、完成、升级、重复及过期 Dispatch 事件 | 生命周期结算正确，重复事件不导致双完成或误重启。 | API + STATE + PROC | 未执行 |
| ACC-N11：重试与执行恢复 | 编排恢复 | 派发后中断协调者，重启并明确重试 | 状态可解释，不无条件重复执行已接受任务。 | API + STATE + PROC | 未执行 |
| ACC-N12：Worker 复用、释放与终端保留 | Worker 生命周期 | 完成后分别复用、释放和保留一个 Worker | 只处理编排归属终端，保留输出可检查，不结束用户独立终端。 | API + STATE + PROC | 未执行 |
| ACC-N13：本地嵌套 Worker | 本地嵌套编排 | 建立同一主机的父子 Run，派发、问答并结束子任务 | 父子范围、消息与资源归属正确；无跨主机联邦入口及隐式远程执行。 | API + STATE + PROC | 未执行 |
| ACC-N14：收敛与卡住状态识别 | 编排总览/CLI | 运行空 Run、全部完成及仅有阻塞任务三种 DAG | 空、完成、活动/卡住状态正确，卡住不误报成功。 | API + STATE + PROC | 未执行 |

### O. 自动化与隔离执行环境（7 项）

共用夹具：FX01、FX02、FX05、FX09。

证据入口：[automations.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/automations.mdx)、[ways-to-run.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/ways-to-run.mdx)、[ephemeral-vm-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/ephemeral-vm-bridge.ts)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-O01：定时自动化创建与编辑 | 自动化设置 | 创建、编辑并重开一个带时区的计划 | 计划文本、时区和下次运行一致，编辑不生成重复调度。 | VIS + CLOCK + STATE + PROC | 未执行 |
| ACC-O02：自动化运行位置（仅本机） | 自动化运行目标 | 在本机指定工作区运行计划，并检查候选目标 | cwd、进程与结果归属本机；不提供远程、云端或 Docker 目标。 | VIS + CLOCK + STATE + PROC | 未执行 |
| ACC-O03：运行前检查 | 运行前检查 | 分别模拟目标存在、目录丢失和 Agent 不可用 | 检查给出对应结果，失败不启动任务、不标记已运行成功。 | VIS + CLOCK + STATE + PROC | 未执行 |
| ACC-O04：启用、停用与手动运行 | 自动化开关/立即运行 | 停用后跨过计划时间，再手动运行并重新启用 | 停用不自动派发；手动运行一次，启用不意外补发多次。 | VIS + CLOCK + STATE + PROC | 未执行 |
| ACC-O05：错过计划的宽限处理 | 错过计划处理 | 控制时钟跨过宽限内外的运行时间后恢复应用 | 补跑/跳过符合合同；睡眠与时钟回退不产生无限重复。 | VIS + CLOCK + STATE + PROC | 未执行 |
| ACC-O06：复用自动化会话 | 自动化会话 | 同一计划连续运行，分别选择复用与新建 | 对应会话和 cwd 正确，不把旧结果标为本次执行结果。 | VIS + CLOCK + STATE + PROC | 未执行 |
| ACC-O07：自动化运行记录与结果 | 自动化记录 | 记录成功、失败、取消和未确认执行，重开列表 | 时间、归属和结果准确，未知结果不强行标为完成。 | VIS + CLOCK + STATE + PROC | 未执行 |

### P. Skills、MCP 与插件（10 项）

共用夹具：FX01、FX10。

证据入口：[skills.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/skills.mdx)、[skills-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/skills-bridge.ts)、[plugins-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/plugins-bridge.ts)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-P01：Skills 发现与列表 | Skills 页面 | 准备本地、项目级和无效技能目录后刷新 | 来源和范围准确，无效条目有原因，不枚举被删平台安装位置。 | VIS + FS + PROC + NET | 未执行 |
| ACC-P02：Skills 安装、卸载和删除 | Skills 管理 | 预览后安装/卸载技能，取消删除再确认 | 只改所选范围，取消不写盘，不删除用户无关文件。 | VIS + FS + PROC + NET | 未执行 |
| ACC-P03：Skills 更新与健康状态 | Skills 状态 | 模拟当前、过期、损坏和更新失败后刷新 | 状态与实际文件/版本一致，失败不标记已更新。 | VIS + FS + PROC + NET | 未执行 |
| ACC-P04：版本匹配的技能指南 | 指南入口/CLI | 以当前及不兼容版本请求相同技能指南 | 返回匹配能力，缺失明确报错，不推荐已删除 CLI 功能。 | VIS + FS + PROC + NET | 未执行 |
| ACC-P08：MCP 配置与服务发现入口 | MCP 设置/发现 | 准备本地 stdio 假服务及无效配置，刷新并取消一次请求 | 发现仅限配置范围，参数正确，退出回收归属进程，不要求远程产品。 | VIS + FS + PROC + NET | 未执行 |
| ACC-P09：插件系统开关（实验性） | 插件开关 | 安装但禁用假插件，重启后再启用和停用 | 禁用时不运行插件；启停状态与后台实际执行一致。 | VIS + FS + PROC + NET | 未执行 |
| ACC-P10：插件 Marketplace 管理 | Marketplace 设置 | 添加本地 Git 源并刷新，测试不可达/非法清单 | 来源与结果可核对，失败保留可解释状态，不偷偷注册云账号。 | VIS + FS + PROC + NET | 未执行 |
| ACC-P11：插件能力预览与启用 | 插件预览 | 预览带面板、命令、语言声明的假插件，并检查已删除环境能力不可启用 | 预览与保留声明一致，启用前不执行；不恢复模拟器及隔离执行环境 Recipe 入口。 | VIS + FS + PROC + NET | 未执行 |
| ACC-P12：插件安装、更新与回滚 | 插件版本操作 | 安装 v1、更新 v2、回滚并移除，再注入失败 | 版本和文件一致，失败不留下混合版本或仍运行的已删插件。 | VIS + FS + PROC + NET | 未执行 |
| ACC-P13：插件日志与诊断 | 插件日志 | 启动会输出标记与错误的插件，过滤后清空/刷新 | 日志按插件归属，错误可定位，凭据不明文出现在日志。 | VIS + FS + PROC + NET | 未执行 |

### Q. CLI 与 Agent 操作接口（11 项）

共用夹具：FX01、FX02、FX05、FX10。

证据入口：[overview.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/overview.mdx)、[reference.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/reference.mdx)、[computer-use.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/cli/computer-use.mdx)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-Q01：CLI 安装与 Shell 注册 | CLI 注册设置 | 注册命令、从外部 Shell 调用，再取消/移除注册 | 解析到正确安装路径，不覆盖用户其他命令，删除提供商不出现。 | CLI + API + PROC | 未执行 |
| ACC-Q02：工作区 CLI | 工作区 CLI | 执行列表、创建、打开和删除，再传入非法 ID | 实际工作区与返回数据一致，错误退出非零，不假成功。 | CLI + API + PROC | 未执行 |
| ACC-Q03：终端 CLI | 终端 CLI | 读取并向指定会话写标记，再关闭该会话后重试 | 只触达指定会话，输出范围正确，过期目标不能转发到其他终端。 | CLI + API + PROC | 未执行 |
| ACC-Q04：会话、状态与配置 CLI | 状态/配置 CLI | 读取运行状态，修改保留配置，再请求未知字段 | 结果与 UI 一致，未知项有明确错误，不暴露已删账号信息。 | CLI + API + PROC | 未执行 |
| ACC-Q05：浏览器 CLI | 浏览器 CLI | 在指定页执行快照/点击/填写，测试目标被关闭 | 页面和结果对应，关闭后失败而非操作其他当前页。 | CLI + API + PROC | 未执行 |
| ACC-Q06：Skills 与 MCP 相关 CLI | Skills/MCP CLI | 查询指南、发现假服务并请求未知技能 | 与 P 组状态一致，失败有可脚本处理的退出与错误。 | CLI + API + PROC | 未执行 |
| ACC-Q07：编排 CLI | 编排 CLI | 完成创建任务、派发、发问、回复、等待和结算闭环 | 状态与 N 组一致，等待可取消，过期事件不结算新任务。 | CLI + API + PROC | 未执行 |
| ACC-Q08：自动化 CLI | 自动化 CLI | 创建本地计划、停用、立即运行并查询结果 | 结果与 UI/调度器一致，不重复创建计划。 | CLI + API + PROC | 未执行 |
| ACC-Q09：工作区检查点 CLI | 检查点 CLI | 读写目标工作区检查点，并请求不存在工作区 | 内容和作用域准确，错误不写入默认项目。 | CLI + API + PROC | 未执行 |
| ACC-Q10：Computer Use | Computer Use 入口/CLI | 在隔离桌面中对专用测试窗口截图、定位并输入标记 | 真实命中目标且可证明；不触碰用户正常桌面，不用伪数据冒充系统操作。 | CLI + API + PROC | 未执行 |
| ACC-Q11：Computer Use 权限与设置 | Computer Use 设置 | 分别拒绝、授予及撤销系统权限后执行受控操作 | 权限状态真实，拒绝/撤销后不可继续操作，错误可恢复。 | CLI + API + PROC | 未执行 |

### S. 活动、通知与工作概览（8 项）

共用夹具：FX01、FX05。

证据入口：[activity.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/activity.mdx)、[notifications.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/notifications.mdx)、[agents-sessions.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/model/agents-sessions.mdx)、[dashboard-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/dashboard-bridge.ts)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-S01：Agent 活动流 | Agents 活动页 | 注入完成、问题和工作区创建事件，筛选后跳转 | 线程、摘要和目标准确，工作中状态顺序符合基线。 | VIS + REPLAY + OS | 未执行 |
| ACC-S02：通知中心与未读状态 | 通知中心 | 产生未读事件，逐条查看和批量标记后重开 | 未读数及状态持久一致，无重连重复通知。 | VIS + REPLAY + OS | 未执行 |
| ACC-S03：系统通知 | 系统通知 | 在隔离会话产生完成/待输入事件并点击通知 | 通知与会话一一对应，点击跳到正确任务，不复用过期目标。 | VIS + REPLAY + OS | 未执行 |
| ACC-S04：通知分类与声音设置 | 通知设置 | 关闭某类通知和声音，触发各类事件 | 只有允许的类型产生系统提示，音量/静音行为可验证。 | VIS + REPLAY + OS | 未执行 |
| ACC-S05：Agent Dashboard（实验性） | Agent Dashboard | 准备运行、待处理、完成和空闲 Agent 后开关看板 | 分组和卡片状态正确，与实际会话一致。 | VIS + REPLAY + OS | 未执行 |
| ACC-S06：Dashboard 搜索与过滤 | Dashboard 筛选 | 按项目、工作区和允许的其他维度组合过滤 | 结果集准确；被删 GitHub PR 筛选入口不残留，其他筛选保留。 | VIS + REPLAY + OS | 需能力基线／未执行 |
| ACC-S07：Dashboard 独立窗口 | Dashboard 弹出 | 弹出看板并选择 Agent，关闭再重开 | 共享正确状态，跳转准确，不重复订阅/派发动作。 | VIS + REPLAY + OS | 未执行 |
| ACC-S08：使用统计概览 | 统计页 | 产生固定本地工作事件后查看统计 | 统计口径明确且可复算，不重新引入 F 组账号额度或成本估算。 | VIS + REPLAY + OS | 需能力基线／未执行 |

### T. 个性化与桌面辅助（语音已移除）（6 项）

共用夹具：FX01。

证据入口：[speech-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/speech-bridge.ts)、[pet-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/pet-bridge.ts)、[settings.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/settings.mdx)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-T07：界面主题与外观 | 外观设置 | 切换主题、对比度和侧栏外观，检查全部核心场景 | 复用设计变量，选中/悬停/错误态可读，重开后配置一致。 | VIS + OS + NET | 未执行 |
| ACC-T08：界面语言 | 语言设置 | 切换中英文及系统跟随，打开菜单、错误提示和长文本页 | 文案完整无截断，语言持久化，快捷键及路径语义不随翻译改变。 | VIS + OS + NET | 未执行 |
| ACC-T09：界面缩放与字体 | 界面缩放/字体 | 切换多档缩放及字体，重新打开窄窗口 | 文字和控件不重叠，编辑器/终端网格正确同步。 | VIS + OS + NET | 未执行 |
| ACC-T10：自定义快捷键 | 快捷键设置 | 录入、冲突、移除并恢复绑定，分别在终端和编辑器触发 | 优先级及焦点范围正确，不重新暴露删除功能快捷命令。 | VIS + OS + NET | 未执行 |
| ACC-T11：应用图标选择 | 图标设置 | 在平台支持时切换应用图标并重启 | 图标选择有效且可恢复；不支持平台明确标注而非伪成功。 | VIS + OS + NET | 未执行 |
| ACC-T12：系统托盘和 Dock 行为 | 托盘/Dock 设置 | 隐藏、显示、关闭窗口并从托盘重新进入 | 窗口和后台任务符合退出策略，图标/菜单无死入口。 | VIS + OS + NET | 未执行 |

### U. 应用身份、网络与运维（7 项）

共用夹具：FX01、FX12。

证据入口：[orca-profiles-bridge.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/preload/api/orca-profiles-bridge.ts)、[settings.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/settings.mdx)、[telemetry.mdx](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/telemetry.mdx)、[updater](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/updater)、[diagnostics](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/diagnostics)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-U05：代理与高级网络设置 | 高级网络设置 | 使用记录请求的本地代理，切换直连并模拟认证错误 | 允许的流量按配置路由，失败不泄漏凭据；不接云边界保持。 | VIS + STATE + NET + OS | 未执行 |
| ACC-U08：首次启动引导与功能提示 | 首次运行/功能提示 | 全新配置启动并走完可保留的引导，再重开 | 不出现 Agent 安装引导、云登录、远程等删除步骤，提示可关闭。 | VIS + STATE + NET + OS | 未执行 |
| ACC-U09：环境诊断与故障排查 | 诊断页 | 移除受控依赖、破坏测试路径后运行检查 | 真实识别缺失项；不要求已删除产品依赖，不擅自修改系统。 | VIS + STATE + NET + OS | 未执行 |
| ACC-U10：崩溃报告本地导出 | 本地崩溃报告入口 | 对受控异常生成报告，查看后取消或导出到本地；检查网络记录 | 本地报告可查看、脱敏并正确导出，取消不写文件；无上传/提交入口、后台发送或失败回退上传。 | VIS + FS + NET + OS | 未执行 |
| ACC-U12：日志、性能与内存诊断 | 日志/性能诊断 | 制造可定位故障并导出日志，重复开始/停止采样 | 诊断不改变任务结果，日志脱敏，采样退出释放资源。 | VIS + STATE + NET + OS | 未执行 |
| ACC-U13：缓存与维护清理 | 缓存维护 | 填充可清缓存，取消后确认清理并继续当前会话 | 仅清理缓存，项目、日志原件、活终端和用户配置不被误删。 | VIS + STATE + NET + OS | 未执行 |
| ACC-U14：推广入口与 Star 提示 | 推广/Star 入口 | 调用保留推广入口，分别有网/断网并取消 | 按已确认合同打开公开链接或明确失败，不恢复 GitHub 账号集成及隐式 API 操作。 | VIS + STATE + NET + OS | 需能力基线／未执行 |

### V. 终端与数据底层能力（按依赖裁剪）（14 项）

共用夹具：FX01、FX04、FX05。

证据入口：[daemon-entry.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/daemon/daemon-entry.ts)、[headless-emulator.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/daemon/headless-emulator.ts)、[terminal-multiplex-round-robin.ts](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/runtime/rpc/terminal-multiplex-round-robin.ts)、[README.md](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/packages/process-host/README.md)、[persistence](https://github.com/stablyai/orca/tree/e2196403c397b44964f6ec80b93a3cfee27aa0df/src/main/persistence)。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-V01：独立终端 daemon | 进程检查/终端 | 启动桌面和测试终端，检查后台进程归属 | 终端由可识别独立 daemon 持有，UI 崩溃不错误宣称任务退出。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V02：桌面退出后继续运行 | 退出应用 | 运行持续写心跳的任务后退出桌面，再在外部检查 | 任务和心跳继续；退出交互必须与保留后台策略一致。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V03：桌面重连已有会话 | 重新打开应用 | 退出后重开，向原会话发送唯一标记 | 连接到原存活会话而非新 Shell，输入输出正确，无重复启动。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V04：终端屏幕状态与快照 | 终端快照接口 | 重放中文宽字符、光标移动、备用屏幕和键盘模式并取快照 | 网格、光标和模式与参照一致，重放不向 PTY 发送非预期查询回复。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V05：输出历史与画面恢复 | 终端恢复 | 后台输出后断开 UI、改变尺寸再重新附着 | 快照与增量无丢失/重复接缝，复杂 TUI 恢复后可继续输入。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V06：终端输出限流与背压 | 输出数据通路 | 以固定速率制造超过可见消费能力的输出并暂停前端 | 队列有上限或明确限流/恢复策略，不无限增长，不损坏控制序列。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V07：多终端公平调度 | 多终端调度 | 一个持续高输出任务与多个交互终端并行 | 其他终端输入仍被处理，延迟满足已签收预算，不被饿死。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V08：输入确认与重连序列 | 输入确认 | 在确认前后分别断开连接并重复发送同一输入序列 | 按合同确认接收，不错误重放产生两次命令；未知结果明确表达。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V09：进程树归属与终止 | 进程终止 | 建立测试进程树，分别结束会话和退出 UI | 只终止显式归属树，无无关进程损伤；UI 退出遵守后台保留策略。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V10：终端存活与健康检测 | 终端健康状态 | 模拟进程退出、连接断开和 I/O 无进展 | 三种状态可区分，不把可响应控制 RPC 当作输入输出健康证明。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V11：会话和布局持久化 | 持久化 | 保存工作区、布局和会话后正常/异常退出并重开 | 恢复一致的已提交状态，新实现不要求旧版数据库或 ID 格式。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V12：配置迁移与异常恢复 | 配置异常恢复 | 对新版写入中断、损坏副本和新版内部版本升级进行恢复 | 可解释选择有效状态，不丢项目数据；不要求迁移旧版 Orca 数据。 | PTY + PROC + STATE + API | 需能力基线／未执行 |
| ACC-V13：本地 RPC 与认证 | 本地接口 | 用合法、无效和缺失令牌调用本地服务并检查权限 | 只允许受授权操作，任意内嵌网页不能获得管理接口权限。 | PTY + PROC + STATE + API | 未执行 |
| ACC-V14：本地能力协商与兼容 | 本地能力协商 | 对本机桌面/CLI/daemon 的能力差异握手并调用未知方法 | 能力差异可诊断，未知方法明确失败；不要求远程或移动协议兼容。 | PTY + PROC + STATE + API | 未执行 |

### W. Agent 专用适配（单独选择）（4 项）

共用夹具：FX01、FX05、FX06。

证据入口：[支持的 Agent](https://github.com/stablyai/orca/blob/e2196403c397b44964f6ec80b93a3cfee27aa0df/docs/site/content/docs/agents/supported.mdx)。下列 40 项按该提交的文档名单列出。

| 用例 / 功能 | 候选入口 | 操作步骤 | 预期结果与异常判据 | 对比方法 | 前置与执行状态 |
| --- | --- | --- | --- | --- | --- |
| ACC-W01：Claude Code | Claude Code 入口 | 使用有来源的适配合同与脱敏日志回放；本轮不要求安装并真实启动 | 启动和支持的状态/聊天能力可验；无安装引导、多账号、额度或热切换。 本轮仅判定合同/回放覆盖的行为，不宣称真实 CLI 已验收。 | REPLAY + API | 合同/回放待执行；本轮不做真实运行验收 |
| ACC-W03：Codex | Codex 入口 | 运行可控 Codex 适配回放，再真实启动/中断/恢复 | cwd、提示词和恢复目标正确；不恢复应用账号托管和旧共享服务设置。 | REPLAY + PROC + PTY | 需能力基线／未执行 |
| ACC-W06：OpenCode | OpenCode 入口 | 使用有来源的适配合同与脱敏日志回放；本轮不要求安装并真实启动 | 支持能力明确，失败可诊断，不因保留适配恢复安装和凭据管理。 本轮仅判定合同/回放覆盖的行为，不宣称真实 CLI 已验收。 | REPLAY + API | 合同/回放待执行；本轮不做真实运行验收 |
| ACC-W07：Pi | Pi 入口 | 运行可控 Pi 适配回放，再真实启动/Hook/历史恢复 | Hook 与日志归属正确；聊天是否支持单独验明，不假设与 Claude 等价。 | REPLAY + PROC + PTY | 需能力基线／未执行 |

## 6. 范围冲突及决定登记

BLOCK-01–04 已通过范围收缩解决，仅作历史记录；无现存范围冲突阻塞。Node 依赖、浏览器技术可行性及旧版退出行为仍需评估与取证。范围决定不代表功能已执行或通过。

| 阻塞编号 | 冲突 | 需要形成的决定 |
| --- | --- | --- |
| BLOCK-01 | 原 K16/K17 与 L/M 删除冲突 | 已解决：K16/K17 删除并转反向验收；K01–K15 有条件保留，技术不可行时允许移除。 |
| BLOCK-02 | 原跨主机/云/WSL 环境依赖冲突 | 已解决：跨主机能力与本地 Docker 移除，O08–O13、P07 删除；N13、O02、V14 收缩为本地能力。 |
| BLOCK-03 | 原公开分享、组织与 Profile 依赖冲突 | 已解决：H11–H13、K18、P05/P06、U03/U04 删除；不影响本地文件预览与普通 Skills/插件管理。 |
| BLOCK-04 | 原云语音、反馈上传及遥测与无第三方云冲突 | 已解决：T01–T04、U11 删除，U10 仅本地导出；反馈上传入口及后台发送移除。U06/U07 更新入口同步删除，分发采用本地打包、手动安装。 |

额外一致性边界：

- D13 保留普通 Agent 面板，W02 删除意味着 Claude Teams 专用集成不恢复。
- E 组需要逐个提供商建立能力表。旧版不支持的提供商/模式不得假称已达到旧版等价；如果要求新增支持，另立合同并实现验收。
- F 全删不取消底层保密要求；自部署 Jira 认证须有明确来源和保护方式，不采用明文泄漏来“省略凭据管理”。
- K06/K08 的浏览器 profile 与 U01 的应用配置 Profile 不同，不能混为同一删除项。
- I17 保留 PR 文本生成，不恢复 J 组已删平台的 PR 创建/提交 API。
- S06/S08、U08/U14 需要去除已删除平台筛选、用量成本、安装引导及账号操作；保留通用功能合同。
- V12 仅要求新实现自身异常恢复及后续内部升级；X05 已明确无需旧版 Orca 数据兼容。
- V14 仅验收本地 daemon 能力协商；远程/移动协议及跨主机部分移除。

## 7. 界面基线场景

这些是待采集画面，不是已存在的截图。每个场景至少记录默认、窄窗口、明暗主题以及可见的加载/空/错误状态；仅对适用组合展开。

| 场景 | 覆盖 | 必须检查 |
| --- | --- | --- |
| VIS01 | 项目侧栏与工作区列表 | 排序、选中/悬停、中文长名、展开收起；删除入口的布局收缩。 |
| VIS02 | 新建工作区表单 | 起始引用、Agent、任务关联、校验/创建进度；无远程主机和安装引导。 |
| VIS03 | 终端与四分屏 | 字符网格、焦点、光标、滚动条、边界和输入法候选位置。 |
| VIS04 | 终端/聊天切换 | 同会话连续性、工具记录、附件、问题卡片和草稿。 |
| VIS05 | 文件树与 Monaco | 长路径、文件状态、定位、搜索、保存失败提示。 |
| VIS06 | Markdown 与预览 | 标题、表格、代码块、目录及文档/图片/PDF 等查看器。 |
| VIS07 | 源码管理与 Diff | 已暂存/未暂存、行号、差异颜色、审阅注释、冲突。 |
| VIS08 | 自部署 Jira | 实例地址、任务列表/详情、字段、权限错误和工作区关联。 |
| VIS09 | 内嵌浏览器 | 地址栏、标签、弹窗、下载、身份隔离、页面焦点。 |
| VIS10 | Design Mode | 元素高亮、裁剪图、样式上下文与发送目标。 |
| VIS11 | 快速打开及菜单 | 键盘导航、候选排序、长文案、快捷键和已删命令不出现。 |
| VIS12 | Skills 与插件 | 列表、更新状态、能力预览、失败/取消、禁用提示。 |
| VIS13 | 活动流与通知 | 未读数、事件线程、跳转和系统权限不足提示。 |
| VIS14 | Agent Dashboard | 状态列、过滤、弹出与跳转；无已删平台筛选。 |
| VIS15 | 自动化与编排入口 | 调度/任务/门控状态及错误；如果只有 CLI 入口则采终端输出合同，不虚构 GUI。 |
| VIS16 | 设置与原生窗口 | 主题、语言、缩放、快捷键、托盘、模态与焦点；无语音设置及录音入口。 |
| VIS17 | 重启与恢复 | 原标签/面板及终端画面恢复，无重复终端和错误重连按钮。 |
| VIS18 | 全新配置与故障恢复 | 初始引导、解析错误、恢复选择；无登录云账号和安装 Agent 步骤。 |

视觉基线从旧版采集后，应单独生成一份“目标布局差异清单”，记录删除功能导致的预期差异。任何截图替换都需说明原因，不能仅为消除差分而更新基线。

## 8. 核心端到端闭环

| 编号 | 流程 | 外部判据 |
| --- | --- | --- |
| FLOW01 | 添加仓库 → 创建 worktree → 启动 Agent → 编辑文件 → 暂存 → 提交 | 独立目录、正确 argv/cwd、文件哈希、Git tree/作者/说明及成功 Hook。 |
| FLOW02 | 并行启动 → 某项等待问题 → 切换其他任务 → 回答 → 完成 | 输入和消息归属正确，一个阻塞不影响其他任务。 |
| FLOW03 | 终端运行 → 桌面退出 → 后台继续 → 重开附着 → 继续输入 | 持续心跳和进程证据、同会话连续、无重复启动。 |
| FLOW04 | 修改页面 → 内嵌预览 → Design Mode → 发送选区 → Agent 收到 | 元素/截图/样式相互对应且只发给目标 Agent；不依赖真实模型答案。 |
| FLOW05 | 本地 Run → DAG → Worker → 问答/决策门 → 结算 | 依赖约束、Dispatch 防迟到、ack 与任务结果一致。 |
| FLOW06 | 本地计划 → 预检查 → 触发 → 复用会话 → 记录结果 | 可控时间下恰好一次派发，记录不误将未知结果视为成功。 |
| FLOW07 | 自部署 Jira 任务 → 查看详情 → 关联工作区 → 返回任务 | 实例请求及工作区关联准确，不调用 Jira Cloud。 |
| FLOW08 | Skills/插件安装 → 启用 → 使用 → 更新失败 → 回滚/删除 | 包版本、文件、进程和能力一致，禁用/删除后无后台执行。 |

## 9. 性能、稳定性与平台门槛

这些是待实测并签收的验收规则，不是已经达到的性能结果。优先比较相同硬件、WebView、夹具和进程树边界，不能只比较 Go 主进程与整个旧版进程树。

| 项目 | 采样方案 | 当前门槛 |
| --- | --- | --- |
| 启动与首个可交互界面 | 冷/热启动分别采样，至少 10 次，记录中位数/P95和完整环境 | 基线采集后确定绝对预算与允许回归幅度，未定不算通过。 |
| 终端输入回显 | 同速率标记输入，对交互终端及高输出并行分别采样 | 上游 typing-latency 用例已有中位数 ≤250ms、最差 ≤1000ms 的断言，仅作可追溯参考；新预算要在一致测量下确定。 |
| 终端输出与恢复 | 固定字节量、分片边界、尺寸变化和暂停前端 | 无非合同允许的丢失/重复，流控与恢复无界面永久卡死。 |
| 并发规模 | 初始建议 1/4/16 会话，固定活动比例与输出速率；按需求再增加 | 数量是拟定负载档位，不能视为承诺；在目标档位公平性和预算均通过。 |
| 内存与空闲 CPU | 统计桌面、WebView、daemon、自带辅助进程；Agent 子树单列且总量同时报告 | 明确采样周期及稳态；无无界增长，资源收益在基线后给出。 |
| 生命周期重复 | 拟执行至少 20 轮创建/切换/关闭/恢复，含取消与错误 | 无重复派发、无孤儿归属进程，无项目/配置损坏；该轮数不是可靠性证明的全部。 |
| 系统输入与窗口 | 中文输入法、剪贴板、快捷键、拖拽、通知、多显示器/DPI | 必须在目标平台原生环境通过；浏览器自动化不能替代输入法验收。 |
| 持续运行 | 固定负载下完成计划的长时间运行与睡眠/唤醒 | 时长与平台在首发范围确定后签收；未执行不能算稳定。 |

当前目标为 Windows 10 及以上（x64）；必须保存 Windows 10 的原生执行证据，不能以较新 Windows 通过代替。具体最低 Windows 10 版本号及 WebView2/依赖版本由原型验证后锁定；其他平台与架构不计入本轮通过声明。每个以后纳入支持的平台和架构都要有独立执行记录；受平台限制的图标、提权、通知等能力要标注可用性，不能用其他平台通过代替。

## 10. 已删除功能的反向验收

下表自动对应功能清单中的 136 个删除条目。正常 UI、设置、命令面板、快捷键、CLI 帮助、自动注册 Hook/服务/定时任务和默认网络请求中，都不应再出现这些专用功能。这里不禁止用户通过普通终端或 D04 自定义命令自行运行任意外部程序。

逐项状态均为未执行；适用入口范围应在旧版入口盘点后补齐。通用代码复用不要求字符串零命中，但不能保留可触发的已删产品能力。

| 反向用例 | 已删除功能 | 验收判据 | 状态 |
| --- | --- | --- | --- |
| NEG-H11 | 公开产物发布 | 移除公开产物发布及服务依赖。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-H12 | 产物列表、搜索与预览 | 随产物发布移除；不影响本地文件搜索与预览。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-H13 | 产物链接复制与删除 | 随产物发布移除。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-K16 | 通过 SSH 主机路由浏览流量 | 移除远程浏览器和 SSH 路由。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-K17 | 远程页面与客户端页面模式 | 移除远程页面模式。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-K18 | 浏览器内容分享为产物 | 随公开产物发布移除。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-O08 | Cloud VM（实验性） | 移除跨主机及云端执行。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-O09 | 环境 Recipe 与目录 | 云端、远程、本地 Docker 环境均移除，不保留专用环境配方目录。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-O10 | 环境创建、附着与取消 | 随隔离执行环境移除；不影响普通本地进程。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-O11 | 环境暂停、恢复和回收 | 随隔离执行环境移除。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-O12 | 本地 Docker 类环境 | 用户明确移除本地 Docker。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-O13 | 环境诊断与清理 | 随隔离执行环境移除；普通应用诊断与工作区清理仍保留。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-P05 | 私有 Skills 分享与安装 | 移除私有 Skills 分享；普通本地安装仍保留。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-P06 | Skills 包、版本与撤销管理 | 随私有分享移除；普通插件版本管理仍保留。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-P07 | Skills 跨主机与 WSL 目标 | 移除跨主机和 WSL Skills 目标。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-U03 | 组织选择与成员管理 | 随账号、公开分享等服务能力移除。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-U04 | 项目跨 Profile 转移 | 随 Profile 及服务分享能力移除。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-T01 | 语音输入 | 语音模块整体移除，无录音/转写、麦克风设置、模型下载/加载、专用快捷入口或隐式后台动作。 | 未执行 |
| NEG-T02 | 麦克风选择与快捷录音模式 | 语音模块整体移除，无录音/转写、麦克风设置、模型下载/加载、专用快捷入口或隐式后台动作。 | 未执行 |
| NEG-T03 | 本地语音模型 | 语音模块整体移除，无录音/转写、麦克风设置、模型下载/加载、专用快捷入口或隐式后台动作。 | 未执行 |
| NEG-T04 | 云端语音识别 | 语音模块整体移除，包含本地与云端识别。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-U06 | 自动更新与更新通道 | 本轮先移除自动检查、下载、安装及更新通道；本地打包后手动安装。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-U07 | 本地构建与预发布更新入口 | 随自动更新移除应用内本地构建/预发布更新入口；不影响开发者构建安装包。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-U11 | 匿名遥测及隐私开关 | 本轮先移除匿名遥测及相关开关，无遥测采集或发送。 无可触发专用入口、隐式后台动作或失败回退调用。 | 未执行 |
| NEG-C17 | Warp 及主题文件导入 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-D02 | Agent 安装与配置引导 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F01 | Claude 多账号管理 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F02 | Codex 多账号管理 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F03 | 运行中账号热切换 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F04 | 其他提供商账号管理 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F05 | API Key 与提供商凭据 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F06 | Agent 配置目录与隔离 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F07 | Codex 配置同步与服务设置 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F08 | 当前账号用量 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F09 | 配额重置与限流提示 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F10 | 用量汇总面板 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F11 | 会话使用统计与估算成本 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-F12 | 系统凭据保护 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J01 | GitHub 账号与认证诊断 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J02 | GitHub Issues | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J03 | GitHub Projects | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J04 | GitHub PR 创建与关联 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J05 | GitHub PR 详情与 Diff | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J06 | GitHub PR 评论与审阅线程 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J07 | GitHub PR 检查与日志 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J08 | GitHub PR 生命周期 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J09 | GitLab Issues 与任务 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J10 | GitLab Merge Requests | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J11 | GitLab CI 作业 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J12 | Bitbucket 集成 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J13 | Gitea 集成 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J14 | Azure DevOps 集成 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J15 | Linear 集成 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J17 | 统一任务页与从任务创建工作区 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-J18 | Hosted Review 与堆叠审阅 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L01 | SSH 主机管理与配置导入 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L02 | SSH 认证、密钥与主机校验 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L03 | SSH 远程工作区 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L04 | SSH 远程终端与 Agent | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L05 | SSH 远程文件编辑与 Git | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L06 | SSH 重连与会话恢复 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L07 | 端口发现与转发 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L08 | 远程服务安装与维护 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L09 | Remote Orca Server 连接 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L10 | 多客户端共享运行时 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L11 | 无界面运行与 serve | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L12 | 远程项目位置与克隆 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L13 | WSL 发行版发现与运行 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L14 | Windows 与 WSL 路径和环境适配 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L15 | WSL CLI、Hooks 与主机管理 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L16 | 工作区主机迁移入口 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-L17 | 远程协议版本兼容 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M01 | iOS 移动客户端 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M02 | Android 移动客户端 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M03 | Web 客户端 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M04 | 二维码与链接配对 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M05 | 配对设备管理与撤销 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M06 | 局域网与自定义地址连接 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M07 | 云中继服务 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M08 | 设备认证与通信加密 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M09 | 移动端 Agent 监控与终端操作 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M10 | 移动端聊天、附件与模型选项 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M11 | 移动端工作区创建与切换 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M12 | 移动端文件、Diff 和源码操作 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M13 | 移动端账号与用量 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M14 | 移动端浏览器画面与控制 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-M15 | 移动端通知与设备设置 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-R01 | iOS 模拟器设备发现与接入 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-R02 | iOS 模拟器画面与输入 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-R03 | iOS 辅助功能树 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-R04 | Android SDK 与设备发现 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-R05 | Android AVD 启动与接入 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-R06 | Android 画面流与输入 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-R07 | Android 应用与权限操作 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-R08 | Android 日志与 UI 树 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-R09 | 模拟器 Agent 工具与技能 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-T05 | 桌面宠物 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-T06 | 宠物导入与管理 | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-U01 | 本地 Profile | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-U02 | 云账号登录与关联 Profile | 无专用可触发入口、自动后台动作及隐式服务访问；失败路径不回退调用该能力。 | 未执行 |
| NEG-W02 | Claude Agent Teams | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W04 | Grok | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W05 | GitHub Copilot CLI | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W08 | OMP | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W09 | Prime Agent | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W10 | Gemini | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W11 | Antigravity | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W12 | Ante | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W13 | Aider | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W14 | Goose | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W15 | Amp | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W16 | Kilocode | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W17 | Kiro | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W18 | Charm Crush | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W19 | Auggie | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W20 | Autohand | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W21 | Cline | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W22 | CodeBuddy | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W23 | Codebuff | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W24 | Freebuff | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W25 | Command Code | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W26 | Muse | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W27 | DeepSeek Harness | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W28 | ZCode | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W29 | Continue | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W30 | Cursor CLI | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W31 | Devin | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W32 | Droid (Factory) | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W33 | Kimi | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W34 | Mistral Vibe | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W35 | MiniMax | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W36 | Qwen Code | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W37 | Rovo Dev | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W38 | Hermes | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W39 | OpenClaw | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |
| NEG-W40 | Trae | 无该提供商专用选择、安装、Hook、历史扫描或默认探测；不限制普通终端自运行。 | 未执行 |

需额外联合核验：没有 Electron 打包产物/应用进程依赖；第三方 Agent 运行时不在此限制内。若采用独立 Chromium 后端，须单独登记，不得称为“完全无浏览器进程”。X03 Node 是否移除仍需决定，不能把移除 Electron 自动解释为禁止全部 Node。

## 11. 上游可复用测试与实现证据

以下文件已在本地仓库核对存在。其中部分已阅读断言；本次未运行它们。应提取用户动作和业务判据，替换 Electron 启动/私有 store 依赖后再用于新版。

- [tests/e2e/golden-worktree-create-switch.spec.ts](D:/Study/orca/tests/e2e/golden-worktree-create-switch.spec.ts)：A05、B01、C02：工作树隔离和切换后原终端连续性。
- [tests/e2e/golden-quit-relaunch-session.spec.ts](D:/Study/orca/tests/e2e/golden-quit-relaunch-session.spec.ts)：B12、V02–V05：标签、文件和活终端退出重开。
- [tests/e2e/golden-file-open-edit-save.spec.ts](D:/Study/orca/tests/e2e/golden-file-open-edit-save.spec.ts)：G03/G05：编辑、落盘和重新打开。
- [tests/e2e/golden-source-control-commit.spec.ts](D:/Study/orca/tests/e2e/golden-source-control-commit.spec.ts)：I07：真实 Git 提交、作者、说明和 Hook。
- [tests/e2e/golden-source-control-open-diff.spec.ts](D:/Study/orca/tests/e2e/golden-source-control-open-diff.spec.ts)：I02：打开正确变更 Diff。
- [tests/e2e/golden-terminal-file-link.spec.ts](D:/Study/orca/tests/e2e/golden-terminal-file-link.spec.ts)：C11/G11：终端文件链接定位。
- [tests/e2e/golden-agent-tui-launch.spec.ts](D:/Study/orca/tests/e2e/golden-agent-tui-launch.spec.ts)：D05/W：真实终端 Agent 启动。
- [tests/e2e/terminal-typing-latency.spec.ts](D:/Study/orca/tests/e2e/terminal-typing-latency.spec.ts)：C01/V07：交互输入回显测量及已有阈值来源。
- [tests/e2e/browser-agent-input-focus-isolation.spec.ts](D:/Study/orca/tests/e2e/browser-agent-input-focus-isolation.spec.ts)：K14：浏览器输入与应用焦点隔离。
- [tests/e2e/browser-guest-crash-recovery.spec.ts](D:/Study/orca/tests/e2e/browser-guest-crash-recovery.spec.ts)：K01/K15：页面崩溃与恢复。
- [tests/e2e/browser-local-https-certificate-trust.spec.ts](D:/Study/orca/tests/e2e/browser-local-https-certificate-trust.spec.ts)：K：本地 HTTPS 信任行为；自部署场景的重要边界。
- [tests/e2e/orchestration-worker-settlement-release-cli.spec.ts](D:/Study/orca/tests/e2e/orchestration-worker-settlement-release-cli.spec.ts)：N/Q：Worker 结算与释放。
- [docs/STYLEGUIDE.md](D:/Study/orca/docs/STYLEGUIDE.md)：主题、颜色、字体、状态色和界面原语规范。
- [src/renderer/src/assets/main.css](D:/Study/orca/src/renderer/src/assets/main.css)：界面视觉 token 的实际源。
- [src/main/daemon/headless-emulator.ts](D:/Study/orca/src/main/daemon/headless-emulator.ts)：V04/V05：headless 屏幕状态及序列化行为。
- [src/main/browser/browser-backend.ts](D:/Study/orca/src/main/browser/browser-backend.ts)：K：内嵌浏览器后端边界。
- [AGENTS.md](D:/Study/orca/AGENTS.md)：基线后台启动、UI 验证及平台要求。

## 12. 执行顺序与发布门槛

1. 按 Windows 10 及以上（x64）、前端复用及一致界面、原退出策略、本地打包推进；补齐 Node 依赖评估、旧版退出行为与浏览器原型；BLOCK-01–04 的范围决定已记录。
2. 先采 VIS01–VIS18 和 FLOW01–FLOW08 的旧版证据，再按组补齐本矩阵。Electron 参照始终固定在基线提交。
3. 先验证真实 PTY/TUI/恢复、内嵌浏览器/Design Mode 两个风险原型，再扩大迁移。浏览器技术不可行时允许移除；须记录证据并联动 K01–K15、Q05、B/H 相关入口及 VIS09/VIS10/FLOW04 后重新计数，不得标为已通过。文档/图片/PDF 预览不随浏览器自动删除。原型不替代最终验收。
4. 每交付一组，运行关联合同、视觉及外部副作用检查；通过后才标为迁移完成。前端界面未变也要验证接口替换后的结果。
5. 本轮真实 Agent 验证仅本地 Codex、Pi，分别保存 CLI 版本、路径及能力表；其余保留适配只记录有来源的合同/回放结果。报告区分真实运行、回放通过和未验证，不要求额外安装 Claude Code/OpenCode，也不得宣称四种 Agent 全部真实验收通过。
6. 发布前所有保留项必须有适用平台证据，所有删除项完成反向检查；未决阻塞和失败不能计入通过率。
7. 无未解释数据丢失、错发输入/附件、错误进程终止、无限队列、凭据泄漏或无法恢复的页面/会话；这些问题直接阻止发布。
8. 性能预算、允许的视觉差异和平台特例均需记录；不能只凭“能启动”和截图相似宣布等价。

### 执行记录模板

| 字段 | 内容 |
| --- | --- |
| 用例 ID / 子场景 | ACC-xxx 或 NEG-xxx；每项正常/异常/恢复分别记录。 |
| 基线与目标构建 | 旧版提交、新版提交/构建、Agent/WebView 版本。 |
| 平台与夹具 | OS、架构、DPI、主题、语言、窗口尺寸及夹具哈希。 |
| 前置决定 | 依赖阻塞号及已确定的能力边界。 |
| 实际步骤与观测 | 可重复操作、预期和实际结果。 |
| 证据路径 | 截图/录像、磁盘/Git、流/事件、进程及网络记录。 |
| 结果 | 未执行 / 已采基线 / 阻塞 / 失败 / 通过。 |
| 差异及处理 | 缺陷号、允许差异理由、修复提交和复验结果。 |

## 13. 本次文档覆盖检查

- 保留功能：216/216，原编号一一对应。
- 删除功能：136/136，列入反向验收。
- 功能决定：相对最初 240/112 清单累计新增删除 24 项；语音 T01–T04、U06/U07、U11 删除，U10 仅本地导出；N13、O02、V14 仅本地能力；K01–K15、Q05 有条件保留，暂计入保留数。
- 当前执行状态：全部未执行；范围冲突项另加阻塞标识。
- 本次产出仅为验收设计文档，未启动 Electron/Wails，未生成截图、夹具或自动化测试代码，也未修改业务代码。
