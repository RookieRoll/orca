# Orca 功能裁剪执行任务表

> 跟踪口径：按《Orca 功能裁剪清单（Go + Wails）》当前决定执行代码清理；此阶段保留 Electron/Node 运行框架，不启动 Go/Wails 迁移。状态仅在代码证据与验证完成后推进。

## 状态定义

- 待执行：尚未开始。
- 进行中：已有人接手或正在盘点/修改。
- 代码已改待验证：代码改动已完成，验证尚未通过或未运行。
- 完成：范围、反向检查和所需验证均有证据。
- 阻塞：存在明确依赖、环境或决策阻塞；需写明原因。

## 范围与执行约束

- 目标基线：Windows 10+ x64；最低 Windows 10 版本仍待技术锁定。此轮不迁移框架，当前 Electron/Node 运行框架必须保留。
- 本地真实 Agent 验证仅 Codex、Pi；Claude/OpenCode 专用适配保留。
- 浏览器仅 K01–K15 应用内嵌浏览器有条件保留，默认不删除；K16–K18 删除。独立 WebConnect / Web runtime 客户端属于 L09/L10 远程连接链，不因 K01–K15 获得保留；若后续因证据决定移除内嵌浏览器，须重新计数并联动验收矩阵。
- 部分保留边界：U10 仅本地崩溃资料导出；N13 仅本地嵌套编排；O02 仅本机执行；V14 仅本地协商。
- 所有入口当前标为“待盘点”，直到代码检索核实具体入口；删除不等于删文件数，需排除保留功能复用及隐式后台行为。
- 删除任务负责人未指派时标“待分配”；依赖按批次任务 ID 表示。
- 范围依据：[Orca 功能裁剪清单（Go + Wails）](<./Orca 功能裁剪清单（Go + Wails）.md>)；验收依据：[Orca 保留功能验收矩阵（Go + Wails）](<./Orca 保留功能验收矩阵（Go + Wails）.md>)。

## 批次索引

| 批次 | 范围 | 退出条件 |
|---|---|---|
| B0 | 环境、清单映射与基线 | 本地环境事实记录，136 删除 ID 校验通过；环境未验证不得写通过 |
| B1 | C17 终端主题导入 | 删除入口/解析并确认保留主题功能无回归 |
| B2 | 语音、宠物、遥测与上传/更新 | VOC、U10、U11、U06/U07、B2-PET已提交；U10本机导出与本地诊断保留；PET定向回归未运行 |
| B3 | 账号/用量与平台集成 | 先完成 B3-ACCOUNT（F01–F07），再完成独立 B3-USAGE（F08–F11），最后按 B3-PLATFORM 清理 J 删除项；保留 F12 凭据保护、Jira（J16）、Git 基础能力及 DEP07 本地工作活动统计 |
| B4 | 远程、WSL、移动与中继 | B2-UPLOAD（U10）、B2-TELEMETRY（U11）、B4-CLIENT、B4-REMOTE-CLIENT、B2-UPDATER（U06/U07）及 B2-PET（T05/T06）已提交；其余按总体依赖推进：B4-REMOTE-HOST → B5-ISOLATION → B4-REMOTE-SHARED 清理消费者和共享实现；B4-SERVICES 与三个 B4-DEVICE-TOOLS 子项依各自依赖交付。保留本地 daemon、工作区、PTY |
| B5 | 分享、组织、Profile 与跨主机隔离 | 删除 O08–O13、U01–U04 等；O02 本机执行保留 |
| B6 | Agent 适配裁剪 | 删除 W02/W04/W05/W08–W40 专用适配；Codex/Pi/Claude/OpenCode 保留 |
| B7 | 公共依赖、构建与回归收尾 | 清理死依赖/入口/IPC/i18n/快捷键/默认后台行为；主体裁剪后执行 `IDENTITY-LITE`，再完成保留项和最终发布回归 |

## 删除功能逐项追踪

| 原编号 | 功能 | 批次 | 状态 | 负责人 | 依赖任务 | 对应代码入口 | 检查证据 / 阻塞 |
|---|---|---|---|---|---|---|---|
| C17 | Warp 及主题文件导入 | B1 | 完成 | c17_cleanup / cleanup_tracker(review) | B0 | `src/main/warp-themes/`、settings IPC/preload、设置 renderer、locale/build metadata（具体路径见提交） | 独立完整 diff 审查通过：删除链/worker 构建入口/locale 无残余 Warp-YAML importer 符号；Ghostty IPC/preload/UI、主题 picker、自定义颜色编辑保留；`terminal-custom-themes.ts` 和测试保留历史 `source: 'warp'` 兼容。`git diff --check`、残余符号检索、10个 JSON Node 解析通过（执行者报告）；6个定向 Vitest 文件118/118通过（Node 24，无 preload shim）。Changed-code quality gate通过、0 findings，但只覆盖新增行的4个文件，不代表所有删除行均经 lint。全量 Node TC 因12 GiB机器资源压力中止、结果未知；Web/CLI TC未运行，定向TC也未运行；此项为纯删除并经有界审查验收，类型检查覆盖限制如上，不得表述为全量TC通过。 |
| D02 | Agent 安装与配置引导 | B2 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| F01 | Claude 多账号管理 | B3-ACCOUNT | 完成（有界静态验收） | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与静态审查） | B0；B7 | 应用托管 Claude 账号/profile/sign-in/热切换已移除；保留 Claude CLI 自有登录、标准 home、会话发现与恢复。回归未运行。 |
| F02 | Codex 多账号管理 | B3-ACCOUNT | 完成（有界静态验收） | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与静态审查） | B0；B7 | 应用托管 Codex 账号/profile/sign-in/热切换已移除；保留 Codex CLI 默认/显式 home、会话发现与恢复、PTY home 证明及共享服务检查。回归未运行。 |
| F03 | 运行中账号热切换 | B3-ACCOUNT | 完成（有界静态验收） | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与静态审查） | B0；B7 | 应用托管账号切换及专属重启/通知路径已移除；保留普通进程退出、PTY 重挂、session 恢复与 Codex quota reset 的持久幂等合同。回归未运行。 |
| F04 | 其他提供商账号管理 | B6-AGENT（W04 Grok、W11 Antigravity、W28 ZCode、W30 Cursor CLI） | 未完成；待对应 W 闭包清理 | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与静态审查） | B0；B7 | B3-ACCOUNT 已移除通用托管账号入口；专用 provider 集成仍须随对应 B6 Agent 删除项闭合：Grok、Antigravity、ZCode 与 Cursor CLI。B3-USAGE 只删除这些 provider 的额度/用量展示，不将尚存 CRUD 记为永久保留。 |
| F05 | API Key 与提供商凭据 | B3-ACCOUNT | 完成（有界静态验收） | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与静态审查） | B0；B7 | Orca 托管 provider API key/凭据写入入口及 IPC/RPC 已移除；保留 status/read paths、OpenCode workspace ID、CLI 登录及 OS keychain/safeStorage 与 Git/GitHub/SSH 认证。回归未运行。 |
| F06 | Agent 配置目录与隔离 | B3-ACCOUNT | 完成（有界静态验收） | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与静态审查） | B0；B7 | 托管 profile/config root 选择与隔离已移除；启动/恢复收敛到 CLI 默认或显式 home，保留可信 session discovery/resume 与本地 Codex hook/config integration。回归未运行。 |
| F07 | Codex 配置同步与服务设置 | B3-ACCOUNT | 完成（有界静态验收） | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与静态审查） | B0；B7 | 托管配置同步/账号服务设置和 legacy account-home 镜像已移除；保留 CLI 自有设置、标准登录、Codex 本地 hook/config 信任维护。回归未运行。 |
| F08 | 当前账号用量 | B3-USAGE | 待执行 | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与唯一runner） | B3-ACCOUNT；B7 | 入口待盘点；与账号删除分开交付，不提前裁用量扫描/性能合同。 |
| F09 | 配额重置与限流提示 | B3-USAGE | 待执行 | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与唯一runner） | B3-ACCOUNT；B7 | 入口待盘点；需区分 provider quota 与保留 Agent CLI 自己输出的运行错误。 |
| F10 | 用量汇总面板 | B3-USAGE | 待执行 | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与唯一runner） | B3-ACCOUNT；B7 | 入口待盘点；保留 DEP07 本地工作活动统计。 |
| F11 | 会话使用统计与估算成本 | B3-USAGE | 待执行 | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types）；validation_setup（config/package/lock与唯一runner） | B3-ACCOUNT；B7 | 入口待盘点；删除账号用量及成本估算，不删除 DEP07 本地工作活动统计。 |
| F12 | 系统凭据保护 | B3 | 保留（基础设施范围已裁定） | cleanup_tracker | B3账号删除的消费者边界 | `safeStorage`/OS keychain、Git/GitHub/SSH认证及剩余Agent CLI自有登录态保留；本项不删除底层凭据保护。 |
| H11 | 公开产物发布 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| H12 | 产物列表、搜索与预览 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| H13 | 产物链接复制与删除 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J01 | GitHub 账号与认证诊断 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J02 | GitHub Issues | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J03 | GitHub Projects | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J04 | GitHub PR 创建与关联 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J05 | GitHub PR 详情与 Diff | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J06 | GitHub PR 评论与审阅线程 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J07 | GitHub PR 检查与日志 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J08 | GitHub PR 生命周期 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J09 | GitLab Issues 与任务 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J10 | GitLab Merge Requests | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J11 | GitLab CI 作业 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J12 | Bitbucket 集成 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J13 | Gitea 集成 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J14 | Azure DevOps 集成 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J15 | Linear 集成 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J17 | 统一任务页与从任务创建工作区 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| J18 | Hosted Review 与堆叠审阅 | B3 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| K16 | 通过 SSH 主机路由浏览流量 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| K17 | 远程页面与客户端页面模式 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| K18 | 浏览器内容分享为产物 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L01 | SSH 主机管理与配置导入 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L02 | SSH 认证、密钥与主机校验 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L03 | SSH 远程工作区 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L04 | SSH 远程终端与 Agent | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L05 | SSH 远程文件编辑与 Git | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L06 | SSH 重连与会话恢复 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L07 | 端口发现与转发 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L08 | 远程服务安装与维护 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L09 | Remote Orca Server 连接 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L10 | 多客户端共享运行时 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L11 | 无界面运行与 serve | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L12 | 远程项目位置与克隆 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L13 | WSL 发行版发现与运行 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L14 | Windows 与 WSL 路径和环境适配 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L15 | WSL CLI、Hooks 与主机管理 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L16 | 工作区主机迁移入口 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| L17 | 远程协议版本兼容 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M01 | iOS 移动客户端 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M02 | Android 移动客户端 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M03 | Web 客户端 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M04 | 二维码与链接配对 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M05 | 配对设备管理与撤销 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M06 | 局域网与自定义地址连接 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M07 | 云中继服务 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M08 | 设备认证与通信加密 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M09 | 移动端 Agent 监控与终端操作 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M10 | 移动端聊天、附件与模型选项 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M11 | 移动端工作区创建与切换 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M12 | 移动端文件、Diff 和源码操作 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M13 | 移动端账号与用量 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M14 | 移动端浏览器画面与控制 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| M15 | 移动端通知与设备设置 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| O08 | Cloud VM（实验性） | B5-ISOLATION | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| O09 | 环境 Recipe 与目录 | B5-ISOLATION | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| O10 | 环境创建、附着与取消 | B5-ISOLATION | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| O11 | 环境暂停、恢复和回收 | B5-ISOLATION | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| O12 | 本地 Docker 类环境 | B5-ISOLATION | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| O13 | 环境诊断与清理 | B5-ISOLATION | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| P05 | 私有 Skills 分享与安装 | B5-SHARE | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| P06 | Skills 包、版本与撤销管理 | B5-SHARE | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| P07 | Skills 跨主机与 WSL 目标 | B5-SHARE | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| R01 | iOS 模拟器设备发现与接入 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| R02 | iOS 模拟器画面与输入 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| R03 | iOS 辅助功能树 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| R04 | Android SDK 与设备发现 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| R05 | Android AVD 启动与接入 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| R06 | Android 画面流与输入 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| R07 | Android 应用与权限操作 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| R08 | Android 日志与 UI 树 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| R09 | 模拟器 Agent 工具与技能 | B4 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| T01 | 语音输入 | B2-VOC | 完成 | graphify_build | B0；B2-VOC；B7 | `src/renderer/src/components/dictation/`、`src/main/ipc/speech.ts`、`src/preload/api/speech-*`、`src/main/runtime/rpc/methods/speech.ts` | 桌面/共享 src 专属链已按有界验收移除；114 个存活 TS-family 改动语法解析零诊断。全仓 mobile 客户端语音调用仍在，待紧接执行 B4-CLIENT 整体删除。 |
| T02 | 麦克风选择与快捷录音模式 | B2-VOC | 完成 | graphify_build | B0；B2-VOC；B7 | `src/renderer/src/hooks/use-audio-capture.ts`、dictation UI/hooks、`src/main/ipc/speech.ts` | Orca 专属录音/设备选择链已按有界验收移除；浏览器/OS 通用媒体权限保留。mobile 专属录音仍待 B4-CLIENT 整体删除。 |
| T03 | 本地语音模型 | B2-VOC | 完成 | graphify_build | B0；B2-VOC；B7 | `src/main/speech/model-*`、`src/renderer/src/components/settings/Voice*`、`src/main/ipc/speech.ts` | 桌面/共享 src 本地模型管理与 UI 已按有界验收移除；mobile 专属模型/客户端引用留待 B4-CLIENT 整体删除。 |
| T04 | 云端语音识别 | B2-VOC | 完成 | graphify_build | B0；B2-VOC；B7 | `src/main/speech/openai-transcription-client.ts`、`src/main/ipc/speech.ts`、`src/shared/rpc-contract/` | 桌面/共享 src 云转写与 RPC schema 已按有界验收移除；生成 RPC catalog 检查通过。全仓 mobile 语音尚待 B4-CLIENT，不宣称全仓语音清空。 |
| T05 | 桌面宠物 | B2-PET | 完成（有界静态审核；测试未运行） | cleanup_tracker / graphify_build / validation_setup | B0；B7 | renderer overlay/statusbar、settings/search、store UI state/hydration、main/preload pet APIs、shared persisted fields | AppRoot overlay、statusbar segment、ExperimentalPane/search入口、renderer pet状态与legacy sidekick hydration及shared settings/UI RPC字段均已移除；旧profile/UI字段在读、写、序列化时剥离。Oxc/RPC静态检查通过；无测试、TC、build运行。 |
| T06 | 宠物导入与管理 | B2-PET | 完成（有界静态审核；测试未运行） | cleanup_tracker / graphify_build / validation_setup | T05；B0；B7 | renderer组件目录、main/preload导入/存储API、共享sprite默认资源 | 21个tracked renderer pet组件文件、PetStatusSegment、专属main/preload APIs、共享sprite defaults及仅由pet catalog导入的3张sprite均已移除；保留AgentCombobox OpenCode SVG/no-img断言。六份locale各删14个精确pet-only目录项，JA `Choose pet` override及17条pet专属timing已删；JSON parse、引用扫描通过。PET/E2E测试与TC/build未运行。 |
| U01 | 本地 Profile | B5-PROFILE | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| U02 | 云账号登录与关联 Profile | B5-PROFILE | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| U03 | 组织选择与成员管理 | B5-PROFILE | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| U04 | 项目跨 Profile 转移 | B5-PROFILE | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| U06 | 自动更新与更新通道 | B2-UPDATER | 完成（有界静态审核） | cleanup_tracker / graphify_build / validation_setup | B0；B2-UPDATER | `src/main/updater*`、`src/main/updater/**`、updater preload/shared contracts；renderer update UI/recovery/status/settings/remote control；release/workflow metadata | 桌面与remote-control自动check/download/install、更新状态/恢复、Squirrel ShipIt、AppImage自动替换及更新E2E已裁剪；普通 app quit/restart/session checkpoint、serve readiness、missing-executable hold、SIGINT/SIGTERM（Linux含SIGHUP）转发、graceful teardown与当前版本显示保留。CLI异步preflight期间stop屏障有独立合同用例；未运行测试。CI独立复核通过：手动EXE/DMG/ZIP/AppImage/deb/rpm分发和签名保留，latest/blockmap/generator引用及updater专属workflow删除；静态YAML/调用闭合通过。无生产writer的desktop-install park协调链已整体删除，Orcad browser普通进程生命周期保留。`publishAutoUpdate:false`下electron-builder仍嵌入静态`app-update.yml`；已核实无runtime updater SDK/reader/check/download/install消费者，不做可能影响签名/target时序的afterpack清理。源代码Oxc语法解析157个存活变更TS/TSX文件零诊断，关键删除模块/符号无活动引用，`git diff --check`通过。测试、TC、build、E2E未运行；未声称回归通过。 |
| U07 | 本地构建与预发布更新入口 | B2-UPDATER | 完成（有界静态审核） | cleanup_tracker / graphify_build / validation_setup | B0；B2-UPDATER | renderer `ReleaseChannelSection`/settings search、`updater.listBuilds`、localBuild/pinned build flows；dev channel staging config/workflows | 应用内channel picker、本地构建/预发布切换和updater feed staging已删除；本地开发打包、版本/build identity展示、手动installer下载/分发保留。公开文档已删除旧channel picker/auto-update说明。workflow/config/lock与renderer闭包纳入U06整体审查；测试、typecheck、build未运行。 |
| U11 | 匿名遥测及隐私开关 | B2-TELEMETRY | 代码已改待验证 | cleanup_tracker（renderer/CI/locale/tracker）；graphify_build（main/shared/preload/types/electron.vite）；validation_setup（package/config/lock、独立UI/CI审查） | B0；B2-VOC、B2-UPLOAD | 产品遥测发送/首启同意及Privacy遥测开关已移除，本地诊断controls保留本机collect/open/discard。四个release workflow移除PostHog secret/env并改用build-identity verifier，YAML/needs/调用闭合及空`secrets:`清理经静态复核通过；source/version/package-manager/build identity校验保留。主进程保留`initObservability`/`shutdownObservability`、durable crash breadcrumb、previous-hang detection、main-thread churn probe、本地NDJSON和脱敏bundle；usage scan/cache与Stats/Memory/Diagnostics API保留，仅移除token-usage报告和分析身份sidecar。遥测分类/事件schema树已删；启动`AgentLaunchContext`三字段及原`telemetry` wire字段、terminal split来源字段保留为运行时/教育来源契约；workspace-create事件来源仅renderer本地且不再传IPC/RPC。AddRepo本地/SSH/remote扫描与handoff、workspace创建、Feature Tips/onboarding/tour、editor、Mac TCC、unknown-tab queue/replay、Native Chat发送/命令/picker/skills/host mode等业务行为均保留；analytics-only mocks/assertions与专属suite已清理，混合行为合同保留。独立hunk审查恢复了`persistence-ui-state.test.ts`两个本地合同：feature-tip ID去重与feature-interaction计数递增；旧telemetry bucket剥离另有本地历史持久化合同。privacy search/nav和活跃diagnostics文案改为本地/不上传语义；六locale及`en-runtime-required.json`官方sync/JSON parse通过，退役consent、DNT、FirstLaunchBanner、analytics-search孤儿文案和旧韩语override已清，privacy policy key保留。`verify-localization-catalog.mjs`验证16,573引用；既有翻译缺失仍为es 177项、fr/ja/ko/zh各167项，不代表全覆盖。validation独立UI/locale/CI静态复核通过。graphify最终审计报告75个删除源模块、0残余引用/mock、0语法解析错误；此前700个存活变更源文件Oxc通过，之后仅针对恢复合同的`persistence-ui-state.test.ts`定向Oxc 0错误并diff-check通过。U11测试、lint/changed-code gate、typecheck、build、E2E及Codex/Pi集成均未运行；未提交，等待root最终审核。 |
| W02 | Claude Agent Teams | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W04 | Grok | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W05 | GitHub Copilot CLI | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W08 | OMP | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W09 | Prime Agent | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W10 | Gemini | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W11 | Antigravity | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W12 | Ante | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W13 | Aider | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W14 | Goose | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W15 | Amp | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W16 | Kilocode | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W17 | Kiro | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W18 | Charm Crush | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W19 | Auggie | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W20 | Autohand | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W21 | Cline | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W22 | CodeBuddy | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W23 | Codebuff | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W24 | Freebuff | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W25 | Command Code | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W26 | Muse | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W27 | DeepSeek Harness | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W28 | ZCode | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W29 | Continue | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W30 | Cursor CLI | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W31 | Devin | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W32 | Droid (Factory) | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W33 | Kimi | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W34 | Mistral Vibe | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W35 | MiniMax | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W36 | Qwen Code | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W37 | Rovo Dev | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W38 | Hermes | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W39 | OpenClaw | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |
| W40 | Trae | B6 | 待执行 | 待分配 | B0；B7 | 待盘点 | 入口待盘点；无验证证据。 |

## 部分保留边界任务

| 范围 | 任务 | 状态 | 负责人 | 检查证据 / 阻塞 |
|---|---|---|---|---|
| U10 | 将崩溃资料能力收敛为用户触发的本地查看/复制；移除反馈表单、上传入口、远端目标、自动发送和上传后台链路。 | 代码及双方静态审查完成（回归未跑） | cleanup_tracker（renderer UI）；graphify_build（backend/shared） | 双方静态复核完成；官方locale/runtime目录校验和38个存活TS-family语法检查通过。回归因当时可用内存2.21 GiB未启动。已推送的前一提交为7b8fe8743dc537ea7c5221b189875700b94470fc，且远端cleanup/function-pruning已只读核对一致。保留collect/open/discard本机诊断预览及崩溃报告查看、脱敏复制、dismiss。诊断bundle仍是带TTL的本机临时文件，复制不是Save As；本任务不新增保存流程。 |
| N13 | 仅本地嵌套编排；移除跨主机/远程 worker 路由，保留本机父子 worker 行为。 | 待执行 | 待分配 | 路由、序列化和调用入口待盘点；需证明无远程目标。 |
| O02 | 仅本机隔离/执行；移除远程主机及云执行目标。 | 待执行 | 待分配 | daemon 与执行目标选择待盘点；保留普通本机进程执行。 |
| V14 | 仅本地协商；删除远程版本协商/兼容分支，保留本地组件协商需要。 | 待执行 | 待分配 | 协议调用链待盘点；混合版本远程兼容不再属于此轮目标。 |

## 公共清理、保留回归与最终门槛

| 任务 ID | 工作项 | 状态 | 负责人 | 依赖 | 完成证据 |
|---|---|---|---|---|---|
| B0-01 | 核对 Windows 10+ x64 本机环境、工具链与依赖可用性；只记录实际发现，不假定安装或验证通过。 | 完成（环境快照） | validation_setup | — | 实测缓存 Node 24.11.1；仓库 pin Node 24 / pnpm 12.14.0；Git 2.56.0。`pnpm`、Codex、Pi、cl/msbuild/rustc/cargo/vswhere 均未在 PATH 找到；已检查的 VS/SDK/Rust/Electron/Codex/Pi候选路径及 `node_modules/electron/dist/electron.exe`、Windows @orca native addon 路径不存在。以上仅证明这些已检查位置无对应项，不代表系统全盘未安装。最近一次资源快照总RAM 12 GiB、可用1.85 GiB、CPU 93.2%；依预算未启动测试/编译。 |
| B0-02 | 自动/人工核对来源清单删除集合为 136 项、编号无重复且完整；保留集合 216 项。 | 完成 | cleanup_tracker | — | 本表来源逐行提取 136 个删除编号；需后续变更时重新比对源清单。 |
| B0-03 | 盘点代码入口、包依赖、构建脚本、测试与后台副作用，建立保留复用关系。 | 进行中 | cleanup_tracker | B0-01 | 已完成语音/宠物/反馈上传/遥测/更新首轮只读入口盘点，候选归属见文件归属表；其余域待盘点。 |
| B0-04 | 生成并审核完整生产源码结构图谱，登记输入状态与覆盖限制。 | 完成 | graphify_build / cleanup_tracker(review) | 本地成果路径：`graphify-out/production-code-structure/` | 图谱已生成并完成独立结构核验，仅保留在本地；所有 `graphify-out/**`（含报告、清单、源哈希快照、生成脚本和缓存）及 `src/graphify-out/**` 均禁止纳入推送，不作为动态行为或运行验证结论。`cleanup/function-pruning` 是经审核后允许推送的跟踪分支；`local/graphify-production-snapshot` 是仅本地备份，禁止推送。 |
| B7-01 | 删除完成后清理 package.json/锁文件中的确认为专用且无保留用途依赖，并检查安装/打包脚本。 | 待执行 | 待分配 | B1–B6 | 依赖图与构建成功证据待补。 |
| B7-02 | 检查 TypeScript 类型、IPC/preload/API 合同及失效调用点。 | 待执行 | 待分配 | B1–B6 | 类型检查和静态检索结果待补。 |
| B7-03 | 清理被删功能专属快捷键、命令面板项、路由、菜单和设置入口。 | 待执行 | 待分配 | B1–B6 | 入口反向搜索证据待补。 |
| B7-04 | 清理 i18n 死键并确认保留界面无缺失翻译。 | 待执行 | 待分配 | B1–B6 | key 使用关系与构建证据待补。 |
| B7-05 | 检查启动时默认后台动作：更新、遥测、上传、远程发现/连接均不可隐式触发；保留本地服务按需运行。 | 待执行 | 待分配 | B2–B5 | 网络/进程/日志证据待补。 |
| B7-06 | 核对测试夹具与测试脚本，移除已删除能力专属测试并保留/调整共享测试。 | 待执行 | 待分配 | B1–B6 | 运行记录待补；不得用删除测试替代验收。 |
| B7-07 | 对 216 项保留能力按验收矩阵做回归，区分通过、失败、阻塞、未执行；包含浏览器条件保留项。 | 待执行 | 待分配 | B1–B6 | 每项/适用子场景证据待关联到验收矩阵。 |
| B7-08 | 删除项最终反向检查：无专用入口、自动后台动作、隐式网络/进程行为及失败回退路径；检查共享实现未误伤保留能力。 | 待执行 | 待分配 | B1–B7 | 逐项搜索与运行证据待补。 |
| B7-09 | 汇总失败/阻塞与未验证项；仅在证据齐全后发布裁剪完成结论。 | 待执行 | 待分配 | B7-01–B7-08 | 最终报告待生成。 |

## 编号覆盖校验

- 来源文档当前决定为删除的 136 个编号已逐项录入上表；总数为 136，编号唯一。
- 删除集合明细按原编号保留；修改范围决定后需从源清单重提取并比较，防止静默漏项。
- 当前代码入口与验证结果没有被臆造；逐项仍标“待盘点”，除 C17 已接手外其余删除项为“待执行”。
- 当前任务仅为代码清理与验证追踪；Go/Wails 迁移不属于本表执行阶段。
- 文档审查记录：验收矩阵曾误用不存在的 `e2166403...` 基线，已核对并修正为有效固定提交 `e2196403c397b44964f6ec80b93a3cfee27aa0df`；GitHub 证据链接将逐项复核。

## 正式代码清理工作包

工作包 ID 是唯一追踪标识；对应删除功能行使用同一包 ID。批次内执行 subagent 由协调者单独指派，涉及公共文件时按下表串行，root 只协调和审查，不直接改代码。

| 包 ID | 范围 | 状态 | 负责人 | 依赖 | 独立交付/完成证据 |
|---|---|---|---|---|---|
| B2-VOC | T01–T04 语音输入/模型/转写与快捷录音模式清理（整体交付） | 完成 | graphify_build | B0；B4-CLIENT 紧随 B2 批次整体删除 `mobile/**` | 完成桌面/共享 src 范围的有界验收；保留通用麦克风选择、浏览器媒体权限及复用音频基础设施。独立 mobile 客户端仍有语音调用，属于 M01–M15 全删范围；不改造将整体删除的客户端，B2 不得宣称全仓 mobile 语音已清空。源码证据：114 个存活 TS-family 改动语法解析零诊断、9 个改动 JSON 可解析、RPC catalog 官方生成与 `--check`、diff-check 通过。23 个唯一测试文件共 397 passed、5 个因缺少既有 Windows native build artifacts 环境失败（其中 3 个 credential migration、2 个 packaging config）、8 skipped；两项修复后的 feature-tip fixture 分别 45/45、26/26 通过。另有 5 个 native-chat field 测试文件因内存预算未运行。相对基线 `a111650acd7154140d1d788749b6103a47589283` 的 changed-code gate 输入为 38 文件/97 新增行；gate 因资源限制中止，完整结果未知，仅完成 code-quality（0 findings）、casting（最初报告两处 fixture 强转，修复后的定向扫描确认新增行无相交诊断）和 focused plugins（0 findings）；type-aware、React Doctor、design-system 与 SAFETY rationale 未完成。全量类型检查未完成且结果未知。 |
| B2-PET | T05–T06 桌面宠物及导入管理 | 完成（有界静态审核；回归未运行） | cleanup_tracker（renderer/docs/locale/Git）；graphify_build（main/shared/preload/types）；validation_setup（package/config/lock与唯一测试runner） | B0；B2-UPDATER | 移除专属 UI/API/后台行为。已核 `codex-pet-sprite-defaults.ts` 仅由pet bundle/URL路径消费，未发现通用Codex动画复用；pet renderer、存储导入API、shared settings/UI state/RPC字段和3个sprite已按引用闭包移除；AgentCombobox OpenCode SVG/no-img合同保留。RPC catalog check/Oxc 28存活TS/TSX/locale JSON/static timing parse/diff-check与删模块引用扫描通过。free RAM为1.89GiB，因此PET测试、TC、build及官方全库locale AST scan均未运行；六locale与runtime-required只执行精确宠物专属key剥离并以JSON.parse/retired-key scan校验，不宣称全locale catalog scan通过。 |
| B2-UPLOAD | U10 反馈/崩溃资料上传清理 | 已提交（8d670ba；静态审查完成，回归未跑） | cleanup_tracker（renderer UI）；graphify_build（backend/shared） | B0 | renderer已移除 feedback 菜单/表单与图片、prefill、drop、draft/store闭包；诊断UI仅保留本机collect/open/discard；崩溃报告移除身份/发送/上传错误，仅保留本地查看、脱敏Copy、Dismiss。UI与backend静态复核完成；六种locale及runtime catalog同步/校验通过，Oxc解析38个存活TS-family文件0错误、0空文件。配置侧 release-javascript-artifact 两文件属于本任务，独立审查通过。回归因当时可用内存2.21 GiB未启动；提交`8d670ba3847272597c13ff407d6ee41d2c030be9`已推送至`cleanup/function-pruning`；前置REMOTE-CLIENT提交`7b8fe8743dc537ea7c5221b189875700b94470fc`也已推送。U11随后由`ced880f7fb0928d85d889b27576677d14bf4c752`提交并推送。临时bundle/TTL不是用户Save As导出。 |
| B2-TELEMETRY | U11 遥测采集/发送清理 | 已提交（ced880f；有界静态审查完成，回归未跑） | cleanup_tracker（renderer、`.github`、renderer locale、tracker）；graphify_build（main/shared/preload/types/electron.vite）；validation_setup（package/config/lock、独立UI/CI审查） | B0；B2-VOC、B2-UPLOAD | 产品遥测发送、首启同意及Privacy遥测开关已移除；本地诊断collect/open/discard保留。四个release workflow已去PostHog secret/env并改用build-identity verifier，YAML/needs/callers经静态复核通过；构建identity/source/version/package-manager guards保留。Main侧保留本地hang/churn观察、crash breadcrumb、NDJSON/bundle、usage扫描/cache与Stats/Memory/Diagnostics；只去产品遥测、consent/cohort/install-id及token usage报告。AgentLaunchContext、terminal split教育来源和本地 workspace/daemon/PTY/SSH行为保留，workspace-create analytics-only source不再经IPC/RPC。Renderer和混合测试行为合同经独立静态审查；GitHub IPC suite保留viewer/star结果/error传播；纯telemetry suite移除，有价值daemon本地证据用例迁移。独立hunk审查发现并修复了`persistence-ui-state.test.ts`里被误删的两个本地合同（feature-tip IDs去重、feature interaction计数递增）；旧bucket数据剥离与本地交互历史持久化另有覆盖。六locale及runtime-required官方同步/JSON parse通过，16,573 refs核验；既有缺译es177、fr/ja/ko/zh各167项；旧privacy consent/DNT/匿名发送文案和韩语override已清，隐私政策保留。提交`ced880f7fb0928d85d889b27576677d14bf4c752`已推送至`cleanup/function-pruning`。main/shared/preload/types最终独立审查完成；75个删除源模块、0残余引用/mock、0语法解析错误。U11测试、lint/changed-code gate、typecheck、build、E2E及Codex/Pi集成均未运行。 |
| B1-C17 | C17 Warp/YAML importer 删除及保留主题功能复核 | 完成（有界验收） | c17_cleanup（实现）；cleanup_tracker（独立审核/Git） | B0 | 追踪行 C17 已完成；独立 diff 审查、定向测试和限界验证记录见 C17。 |
| IDENTITY-LITE | 将应用与产品身份全新调整为 `orca-lite` | 待执行（仅计划） | 待分配 | U06/U07；B7-COMMON | 先盘点 package/app display name、electron-builder `productName`、安装器与可执行文件名、窗口标题、公开文档、CLI命令、app ID、userData、deep-link/protocol及本地pipe/socket命名，再按清单统一建立全新 `orca-lite` 身份；不保留旧应用身份别名、数据迁移或旧协议兼容层。禁止全局盲替换`orca`，保留第三方`@orca`包名和历史/业务标识；不改仓库目录/GitHub远程仓库URL。建议在主体裁剪完成后、B7最终构建/发布回归前执行。 |
| B2-UPDATER | U06/U07 自动更新、下载安装与更新推荐清理 | 完成（有界静态审核） | cleanup_tracker（renderer/CI/docs/tracker）；graphify_build（main/preload/shared/types/native CLI）；validation_setup（package/config/lock及独立CI审查） | B0；B2-VOC/B2-UPLOAD/B2-TELEMETRY已完成代码清理 | 删除桌面与remote-control自动check/download/install、Squirrel自动更新补丁、AppImage自动替换与预发布/本地构建切换入口；保留当前版本/build identity、人工发布安装包、Orcad本地bundle一致性、Electron普通退出/重启/session恢复及serve监督/信号转发/ready。CLI保留暂时缺少可执行文件时的hold、普通失败重试及异步preflight期间停止屏障；无生产writer的desktop-install park协调链已删除。`publishAutoUpdate:false`下electron-builder仍嵌入静态`app-update.yml`，但不存在runtime updater SDK/reader/check/download/install消费者；不做可能影响签名/target时序的afterpack/aftersign过滤。Homebrew和公开安装/设置/session恢复文档已改为人工下载安装。validation独立CI/UI/配置静态检查通过；源代码Oxc语法解析157个存活变更TS/TSX文件零诊断，关键删除模块/符号无活动引用，`git diff --check`通过；测试、typecheck、build、E2E未运行。 |
| B3-ACCOUNT | F01–F07 应用托管 Agent 账号、Profile、热切换、provider API key 与配置隔离 | 已交付（F01–F03、F05–F07；F04 专用集成移至 B6 对应 W 项；回归未运行） | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types/source tests）；validation_setup（config/package/lock与唯一静态审查） | B0 | 应用托管账号/profile/切换、API key 写入与账号 RPC、legacy account-home/auth/config 镜像已移除。保留 CLI 自有登录与标准/显式 home、session discovery/resume/backfill、PTY home registry/shared-server fail-closed 检查、普通终端重挂、Codex reset-credit 幂等、provider usage status/read 与 refresh、OS keychain/safeStorage、Git/GitHub/SSH 认证和 DEP07 本地工作活动统计。最终静态闭合：140个删除生产模块、2406个候选引用扫描零悬空引用/零解析错误；345个存活变更TS/TSX Oxc解析零错误/零空文件，7个JSON解析通过，diff-check通过。Vitest、typecheck、build、E2E均未运行；最近可用内存样本1.98GiB低于2.5GiB测试门槛。619个精确候选路径已提交；外部 `.gitignore` 改动未纳入。 |
| B3-USAGE | F08–F11 provider quota、账号用量、汇总与成本估算 | 进行中（A 组静态审查通过；回归未运行） | cleanup_tracker（renderer/locale/docs）；graphify_build（main/shared/preload/types/source tests）；validation_setup（config/package/lock与唯一测试runner） | B3-ACCOUNT；B0 | A 组移除 provider 历史用量与成本面板，保留 DEP07 的本地 agent/work-time/PR 活动统计。进行中的 FeatureWall 清理移除 quota snapshot poller 与 Usage 步骤，同时保留 Visibility、Orchestration 和其余 tour 行为。后续按组移除 provider quota/reset 状态与账号用量入口，以及 Automation History 的 Spend/Tokens 列；保留 CLI context token 用于 compaction/request correctness、CPU/RAM/process stats、CLI 登录指导、普通 auth/rate-limit 错误和 F12 凭据保护。F04 专用 provider CRUD 不在此项扩删，随 B6 的 W04/W11/W28/W30 对应集成删除项闭合。共享 benchmark/JSONL 工具仅在证明无非账号用途后移除。 |
| B3-PLATFORM | H11–H13 公开产物链及 J01–J15/J17–J18 平台集成删除项 | 待执行 | 待分配 | B0；B3-ACCOUNT | 清理对应公开产物发布/管理与第三方平台产品闭包；保留 Jira J16 和普通 Git/GitHub/SSH 认证基础设施。共享 GitHub client 按残余消费者决定，不能整模块删除。 |
| B5-PROFILE | U01–U04 本地 Profile/云账号/组织/切换裁剪 | 待执行 | 待分配 | B0 | 去除组织/云 Profile 流程并确认仍需保留的本地配置归属；共享设置/store 由协调者串行分配。 |
| B5-SHARE | P05–P07 私有 Skills 分发/版本/WSL目标清理 | 待执行 | 待分配 | B0；B4-WSL 完成后清理 WSL 目标残余 | 保留本地 Skills/MCP/插件能力；删除私有分发、安装源、版本回滚和 WSL 目标专属流程。 |
| B5-ISOLATION | O08–O13 Cloud VM、recipe、资源管理及 Docker 隔离裁剪 | 待执行 | 待分配 | B0 | 去除远程/云/Docker 专属环境，保留 O02 本机隔离及普通本地进程执行；复核共享执行器。完成后才能清理与这些环境共用的远程 runtime/protocol（B4-REMOTE-SHARED）。 |
| B5-CROSS | B5 与 B2/B4 重叠的跨功能共享入口及配置收尾 | 待执行 | 待分配 | B5-PROFILE/B5-SHARE/B5-ISOLATION；依文件冲突串行 | 只清理由多个范围交叉形成的残余入口；每个共享文件事先指定唯一执行者，附保留依赖检索。 |
| B4-CLIENT | M01–M15 独立移动客户端整体删除 | 完成（有界验收） | graphify_build（`mobile/**`源码/RPC/artifact）；validation_setup（package/config）；cleanup_tracker（`.github` workflows/actions） | B2-VOC 完成；然后优先执行 | 完成独立移动客户端及客户端侧 M01–M15 删除的有界验收；这不代表整个 B4 范围完成：M04–M08 根服务待 B4-SERVICES，L/K16–K18 远程服务待 B4-REMOTE，O08–O13 待 B5-ISOLATION，R01–R09 待 B4-DEVICE-TOOLS。删除整个 `mobile/**`（基线 Git 跟踪清单 3,859 条路径），覆盖 iOS/Android/Web 客户端与其语音闭包；不在将删除的客户端内做语音兼容改造。`.github` 已删除 3 个独立 mobile workflow、2 个 mobile composite action；混合 PR/node-server CI 的 mobile job、bundle/artifact 链与缓存/依赖调用已清理，layout-owner 路由移除 5 个客户端专属 E2E；桌面/package/daemon/SSH/WSL 检查保留。从 `613db6ca13aecc356c0a43c24a81f61c366c33f8` 只读核对到 4,085 个 tracked B4-CLIENT 变更路径（4,000 删除、85 修改）：`mobile/**` 3,859 项全部删除且无mobile未跟踪文件；其余路径限于 `.github` 29、`config` 157、`src` 31、`tests` 7、`package.json` 1、本追踪表1项；无图谱/cache/`.gitignore` 路径或其他根目录项。YAML 静态解析24个存活改动文件无错误，PR/node-server needs闭合，diff-check通过，CI未运行；15个存活source TS文件语法解析零诊断且RPC catalog官方生成/`--check`通过。27个唯一回归文件共729 passed、3个环境失败、9 skipped；3个环境失败分别涉及缺少既有native artifacts（2项）和符号链接操作EPERM（1项），不能计为通过。另有1个 `node-server-change-scope` 检查因全仓扫描时可用内存从2.74降至1.55 GiB而中止，结果未知；4项检查未运行：max-lines、changed-gate unit、terminal-smoke-scope、node-server-policy。CI、changed-code gate、type-aware、全量TC和build均未运行。图谱生成内容仅本地并被ignore规则排除。release-cut 对历史 `mobile-v*` 标签的隔离逻辑保留以防版本误选。ignore维护提交 `613db6ca13aecc356c0a43c24a81f61c366c33f8` 仅修改 `.gitignore`，将 `/graphify-out`、`/config/.cache`、`/src/graphify-out/` 保持为本地忽略内容。 |
| B4-REMOTE-CLIENT | L09/L10 独立 WebConnect/Web runtime 客户端与产品入口删除 | 已提交（7b8fe8；静态审查完成，回归未跑） | graphify_build（renderer Web client、共享 runtime 相关调用、专属 E2E）；validation_setup（config/package/build/verify 与配置测试）；cleanup_tracker（`.github` workflows、settings/navigation UI gates、任务表） | B4-CLIENT；B0 | 移除独立 Orca Server WebConnect 客户端、pairing Web 输入/保存入口及独立 Web runtime 构建/产品入口。K01–K15 仅指应用内嵌 BrowserPane，不能作为保留独立 WebConnect 的理由。全部15个 WebConnect-only E2E spec 已删除，包括 `paired-startup-exec-readiness.spec.ts`（两项均启动 WebConnect）；保留 Electron BrowserPane 的 `packaged-mixed-version-browser-placement.spec.ts`，以及使用 paired Electron 的 `paired-remote-terminal-browser-link.spec.ts`、`paired-remote-html-preview-local-render.spec.ts`。CI 删除 `e2e.yml`、`pr.yml`、`terminal-ime-e2e.yml`、`packaged-browser-e2e.yml` 中独立 web-client build/setup/job 路由；保留 Electron、CLI、native、BrowserPane、local daemon、PTY、SSH Git 和常规 Electron E2E 链。settings/navigation 中 Web-only gates 已移除，真实 platform/host/capability 条件与桌面功能保留；validation 独立静态复核通过。最终静态验证：Node 24 + `oxc-parser@0.148.0` 对235个存活 TS/TSX/MTS/CTS 文件做语法解析，0 errors（不代表类型检查）；4个改动JSON通过 `JSON.parse`，全局 diff-check 通过。生产及测试源码中 `__ORCA_WEB_CLIENT__`、`isWebClient`、`isPairedWebClient`、`webClientUrl` 均无残留；locale 中的历史 WebConnect 文案键由官方动态catalog规则保留，collector无调用点。Native Chat find 在Resolved/Structured两个Electron renderer路径均保留，删除只针对Web的 font-size hook。提交`7b8fe8743dc537ea7c5221b189875700b94470fc`已推送至`cleanup/function-pruning`。CI未运行；配置定向测试121项中116通过、2项因本机缺既有 Windows native `.node` 产物失败、3项跳过。UI metadata 定向测试旧结果21通过/1失败为语音移除后的陈旧数量断言，已改为精确9项但未重跑；其他UI测试未运行。全量类型检查、changed-code gate、type-aware lint、build 和全量 CI 未运行。paired Electron 远程测试和 runtime pairing仍属于后续 REMOTE-HOST 范围；不代表 L/K跨主机执行、B5隔离环境或 M 根服务已清除。Graphify产物仅本地。 |
| B4-REMOTE-HOST | L01–L08、L11–L16 的 SSH/WSL 主机消费者与远程 serve 执行入口删除 | 待执行 | 待分配 | B4-REMOTE-CLIENT；B0 | 清理 SSH/WSL 工作区、host/runtime 管理、远程执行与路由消费者；L11 仅删除远程 serve 产品入口，不影响 DEP06 本地 daemon。沿依赖确认消费者已删后再处理共享实现。SSH Git transport、普通 Git 仓库认证和本地 Git 能力不是 Orca 跨主机执行，不随本包删除。 |
| B4-REMOTE-SHARED | L17、K16–K17 及 L/K 远程消费者专属的共享 pairing、E2EE、WebSocket/network 暴露与协议实现 | 待执行 | 待分配 | B4-REMOTE-HOST；B5-ISOLATION；B0 | 只移除已删除 Web/SSH/WSL/VM 消费者独占的共享代码；逐项证明其余消费者均已删除或本地用途可独立保留。K18 随 B3 的 H11–H13 发布产物链清理。必须保留 DEP06 本地 daemon、后台运行、重新附着、UnixSocket/NamedPipe、本地 RPC/PTY 与凭据保护。 |
| B4-SERVICES | M04–M08 移动配对、中继与设备服务实现删除 | 待执行 | 待分配 | 默认：B4-CLIENT、B4-REMOTE-HOST、B5-ISOLATION；B0 | 删除仓库根目录的移动配对、设备认证/通信与 cloudrelay 服务入口；默认在待删客户端和远程/隔离消费者清理后再删共享协议实现。mobileCloudrelay 可拆独立子任务提前执行，但须先确认 auth/transport 共用接口无剩余消费者或本地用途；不得以当前尚有待删移动调用者为保留理由。不得误删本地 daemon/普通本地终端能力。 |
| B4-DEVICE-TOOLS | R01–R09 模拟器工具总项 | 待执行 | 待分配 | B4-CLIENT；B0 | 总项由以下三个互斥子任务覆盖，分别独立审核/提交推送；不改动保留的本地 daemon、普通终端与本地 PTY。 |
| B4-DEVICE-IOS | R01–R03 iOS 模拟器设备、画面/输入与辅助功能树 | 待执行 | 待分配 | B4-DEVICE-TOOLS；B0 | 删除 iOS 模拟器发现/接入、画面与输入、辅助功能树相关代码；实施前盘点精确代码入口。 |
| B4-DEVICE-ANDROID | R04–R08 Android SDK/AVD、画面/输入、应用权限与日志/UI 树 | 待执行 | 待分配 | B4-DEVICE-TOOLS；B0 | 删除 Android SDK/设备发现、AVD、画面流/输入、应用权限操作及日志/UI 树相关代码；实施前盘点精确代码入口。 |
| B4-DEVICE-AGENT | R09 模拟器 Agent 工具与技能 | 待执行 | 待分配 | B4-DEVICE-TOOLS；B0 | 删除模拟器 Agent 工具与技能入口；实施前盘点其与保留 Codex/Pi Agent registry 的边界。 |
| B6-AGENT | W02/W04/W05/W08–W40 非保留 Agent 专用适配 | 待执行 | 待分配 | B0；B3-ACCOUNT | 删除不保留 Agent 的专用适配/管理入口；保留 W01/W03/W06/W07 及本地真实验证 Codex/Pi。共享 Agent registry、CLI 自有 auth、session discovery/resume 需按 consumer 拆分。 |
| B7-COMMON | 公共依赖/构建/类型/IPC/快捷键/i18n/默认后台/测试清理 | 待执行 | 待分配 | B1–B6 所有代码包完成 | 独立清理确认无保留用途的死代码/依赖；锁文件只由指定者改；运行对应类型、构建、合同与回归证据。 |

### B5 跨功能边界单列

| 边界 ID | 涉及范围 | 状态 | 负责人 | 文件/调用链检查要求 |
|---|---|---|---|---|
| B5-X01 | 组织与 Profile 共享配置 | 待执行 | 待分配 | U01–U04 与普通本地设置/store 区分，单一 subagent 串行改共享 store/IPC。 |
| B5-X02 | Skills 私有分发与 WSL 目标 | 待执行 | 待分配 | P05–P07 与保留的本地 Skills、插件/MCP 入口区分；等待 WSL 包确定清理后处理共享目标。 |
| B5-X03 | 隔离环境与本地执行器 | 待执行 | 待分配 | O08–O13 与 O02 本机隔离、普通进程/本地 daemon 复用关系核对后再删。 |
| B5-X04 | 宠物/崩溃上传/遥测共用 UI、IPC、共享类型 | 待执行 | 待分配 | B2-PET/B2-UPLOAD/B2-TELEMETRY 各自完成专属改动后，由协调者指定唯一执行者清残余。 |

## 代码清理文件归属与并行边界

以下为基于当前路径检索的候选归属，精确文件须由接手者沿 IPC/import/调用链核实后登记；候选目录不代表整目录可删。共享文件由协调者指定唯一执行 subagent，按批次串行修改公共文件；root 仅协调审查，不直接改代码。

| 任务组 | 候选文件归属 / 已检索入口 | 并行边界与保留要求 |
|---|---|---|
| B2-VOC（T01–T04） | `src/renderer/src/store/slices/dictation.ts`、`src/renderer/src/components/feature-tips/VoiceDictationTipDialog.tsx`、`VoiceDictationFeatureTipVisual.tsx`；具体录音/模型实现、IPC、RPC 与 mobile speech runtime 调用链由同一执行者继续核对 | 整体交付；移除语音专属录音/模型/转写与快捷录音模式。保留通用麦克风选择和 browser media permission；shared speech runtime RPC 文件由 B2-VOC 唯一执行者改完后交 B4 只读复核，避免并行修改。共享设置/telemetry schema需协调者另行点名。 |
| B2-PET（T05–T06） | graphify_build：`src/main/ipc/pet*`、`src/preload/api/pet-{bridge,api}.ts`、`src/shared/pet-types.ts`、Codex sprite defaults及`GlobalSettings.experimentalPet`/Persisted UI state/RPC 类型消费者；cleanup_tracker：`src/renderer/src/components/pet/**`、`PetStatusSegment`、`ExperimentalPane`、app-root/status-bar加载与 renderer locales/docs；validation_setup：package/config/lock/scripts与唯一测试runner | U06/U07提交后整体实施。共享持久化/schema/preload文件和lock按owner互斥；验证先核 pet 专属 build/assets/package checks，再由validation_setup串行执行有界定向回归。已查 `codex-pet-sprite-defaults.ts` 当前仅由宠物导入bundle与宠物URL consumer调用，未见一般Codex功能调用；实施前以最终`rg`闭包复核，不可按文件名推断保留用途。 |
| B2-UPLOAD（U10） | `src/renderer/src/components/sidebar/SidebarSettingsHelpMenu.tsx` 及 feedback dialog/image/drop/environment-prefill/draft/store/image-attachment闭包；`PrivacyDiagnosticsSection.tsx`/`PrivacyDiagnosticBundleControls.tsx`；`CrashReportDialogSurface.tsx`/`use-crash-report-copy.ts`。backend/shared由 graphify_build负责 `src/preload/api/{feedback,diagnostics,crash-reports}*`、`src/shared/{feedback-submit-contract,crash-reporting}*` 与主进程上传handler | 文件所有权按renderer UI与backend/shared分开；renderer只调用 getStatus/collectBundle/openBundlePreview/discardBundlePreview 和 crash report get/dismiss/copy契约。保留 `bundleSubmissionId` 作为本机临时预览map key，不作为上传票据。不得与 `src/main/crash-reporting/` 本地采集/复制实现维护者并行改同一文件。 |
| B2-TELEMETRY（U11） | cleanup_tracker：`src/renderer/src/components/TelemetryFirstLaunchSurface.tsx`、`FirstLaunchBanner.tsx`、`app-shell/AppRootSurfaces.tsx`、`app-shell/app-root-surface-settings.ts`、Privacy/settings telemetry 控件、renderer telemetry client及feature埋点调用/专属测试、renderer locale、`.github/workflows/**`；graphify_build：`src/main/telemetry/`、`src/preload/api/telemetry-api.ts`、`src/shared/telemetry-*`按真实consumer逐项拆分、main IPC/types、`electron.vite.config.ts`；validation_setup：package/config/lock与telemetry常量检查脚本/合同测试 | 单项职责按目录边界串行；不得整组删shared事件schema。现有 `tuiAgentToAgentKind` 是启动/路由领域映射，不因同在 `lib/telemetry.ts` 删除；PTY startup的agent kind/launch source/request kind字段若实际用于主进程/renderer恢复行为，应先迁到中性模块并保留。保留本机diagnostics status、local log/bundle collect/open/discard、Stats/Memory/Diagnostics API；仅删除产品使用事件采集、PostHog网络发送、首启同意/隐私开关及遥测专属配置/CI核验。CI保留build identity、source SHA、版本和包管理器验证；renderer locale清除实际活跃DNT/遥测同意文案，按官方catalog流程同步。 |
| B2-UPDATER（U06/U07） | `src/main/updater.ts`、`src/main/updater/`、`src/main/window/main-window-updater.ts`、`src/preload/api/updater-{bridge,api}.ts`、renderer updater UI/store/RPC controls | 已按调用链拆分；ordinary app restart/session recovery、Orcad bundle deployment、manual package distribution/build identity 保留。静态 builder `app-update.yml` 为已记录的非运行时残留。U06/U07 统一独立审核；测试/build 不启动，资源安排后再按保留行为挑选有界回归。 |
| B3-PLATFORM（J01–J15,J17–J18） | GitHub/GitLab/Linear/Bitbucket/Azure 等 preload API、main handler、renderer task-page 入口待盘点 | J16 Jira 必须保留；Git基础能力由 I 组保留；平台专用文件可以独立，但共享 GitHub client 不可整体删除。 |
| B4-REMOTE（L01–L17、K16–K18） | `src/main/wsl*`、`src/wsl-guest/`、`src/preload/api/{ssh,wsl,legacy-relay}*`、renderer remote runtime/terminal transport、独立 `src/renderer/src/web` runtime client；移动端归 B4-CLIENT/B4-SERVICES，隔离环境归 B5-ISOLATION，模拟器归 B4-DEVICE-TOOLS | 按 B4-REMOTE-CLIENT → B4-REMOTE-HOST 与 B5-ISOLATION → B4-REMOTE-SHARED 的顺序清理消费者后再删共享实现。高度复用本地 daemon/PTTY，需协调者指定唯一执行者并串行修改；明确保护本地 daemon/background/重新附着、UnixSocket/NamedPipe、本地 RPC/PTY/凭据保护。K01–K15 仅指有条件保留的应用内嵌浏览器；独立 WebConnect/Web runtime 属 L09/L10 删除范围。SSH Git transport/认证属于 Git 能力，不因 L 组删除。 |
| B6-AGENT（W 删除项） | `src/main` 中各 provider 适配目录、preload provider registry、renderer agent provider catalog（精确文件待盘点） | 保留 W01/W03/W06/W07；Claude/OpenCode 专用适配仍保留，Codex/Pi 是本地真实验证 Agent。共享 agent registry 由单一负责人编辑。 |
| B7-COMMON | package/build/type/IPC/快捷键/i18n/后台默认任务/测试清理 | 各功能批次完成后由协调者分配残余项；不抢改上游批次正在编辑的文件。 |
