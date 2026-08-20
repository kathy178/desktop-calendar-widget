# 桌面悬浮日历与备忘录

Windows 桌面悬浮小工具：始终置顶的日历 + 待办 + 备忘录 + 提醒，界面简洁、支持毛玻璃质感、可收起为小组件。

技术栈：Electron + React + TypeScript + electron-vite + zustand + electron-store。

## 功能一览

- **悬浮日历**：年 / 月 / 周 / 日四种视图，高亮今天，展示农历、法定节假日与调休标记，日期下方圆点标记当天是否有待办/备忘；年视图可一览全年12个月，点击任意日期或月份直接跳转。
- **待办事项**：新建/编辑/删除/完成，支持日期、时间、优先级、标签、重复规则（每天/每周/每月）、到期提醒；今天/逾期/即将到期自动分组，已完成项默认折叠。
- **备忘录**：便签式卡片，支持标题、正文、关联日期、标签、颜色分类、置顶、关键词搜索；右下角"+"提供无需填表的"快速记录"入口。
- **倒数日**：记录"距离XX还有几天"或"XX已经过去几天"（如生日、纪念日、截止日期），支持"每年重复"自动换算到下一次。
- **提醒**：到点弹出系统通知 + 应用内轻提示，支持"稍后提醒（10/30/60分钟）"和"标记完成"。
- **悬浮窗交互**：始终置顶（可关）、可拖拽、可调整大小（260~480px 宽）、背景不透明度可调（100% 为完全不透明、自动关闭毛玻璃模糊，兼顾可读性与性能）、点击穿透模式、收起为小组件（悬停自动展开，可关闭自动收起）。
- **数据与设置**：本地 JSON 落盘，重启不丢失；支持数据导出/导入（JSON）；设置页含开机自启、置顶、明暗模式、字体大小、背景不透明度、提醒开关。

## 目录结构

```
electron/            主进程：窗口管理、IPC、提醒调度、本地存储
  main.ts
  preload.ts
  windowManager.ts
  ipc/
  store/
  utils/
src/renderer/         渲染进程（React 应用）
  components/          按功能划分的组件（Header/CalendarView/TodoPanel/...）
  store/                zustand 全局状态
  hooks/                自定义 hook（如小组件收起/展开逻辑）
  utils/                日期/农历/待办/备忘录等纯函数工具
  styles/               全局样式与明暗主题变量
shared/               主进程与渲染进程共用的类型定义、IPC 通道名
tests/                Vitest 单元测试（日期计算、排序、搜索等核心逻辑）
.github/workflows/    GitHub Actions：push 后自动在 Windows 环境编译安装包
```

## 本地开发

需要 Node.js 18+（推荐 20）。

```bash
npm install
npm run dev        # 启动开发模式（需要图形界面环境，Windows/macOS/桌面版 Linux 均可）
```

## 常用命令

```bash
npm run typecheck   # TypeScript 类型检查（主进程 + 渲染进程）
npm run lint        # ESLint 检查
npm run test        # Vitest 单元测试
npm run build       # 编译（不打包）
npm run build:win   # 编译 + 打包 Windows 安装包（NSIS 安装版 + 便携版），产物在 release/ 目录
```

## 获取 Windows 安装包（两种方式任选）

### 方式一：GitHub Actions 自动打包（推荐）

代码每次 push 到 `main` 分支，或手动触发 workflow（Actions 页面 -> Build Windows Installer -> Run workflow），都会在 GitHub 的 Windows 虚拟机上自动执行 `npm run build:win`，构建产物会作为 Artifact 上传，在对应的 workflow 运行记录页面下载即可，无需本地准备任何 Windows 编译环境。

### 方式二：在自己的 Windows 电脑上打包

1. 安装 [Node.js](https://nodejs.org/)（LTS 版本即可）
2. 打开命令行，进入项目目录，依次执行：
   ```bash
   npm install
   npm run build:win
   ```
3. 打包完成后，在 `release/` 目录下会看到：
   - `桌面悬浮日历-1.0.0-x64.exe`（NSIS 安装版，双击安装到系统）
   - 对应的便携版 `.exe`（无需安装，双击直接运行）

## 数据存储位置

数据以 JSON 文件形式保存在系统用户数据目录，卸载应用不会自动清除（除非手动删除该目录）：

- Windows: `%APPDATA%\桌面悬浮日历\app-data.json`

首次启动会自动写入几条示例待办和备忘录，方便直接体验功能；设置页可以随时导出当前数据备份，或从备份 JSON 恢复。

## 已知局限 / 后续维护说明

1. **法定节假日/调休数据**：来自 `lunar-javascript` 库内置的 `HolidayUtil`，覆盖到该库发布时已公布的年份。国务院一般每年年底才公布次年的放假安排，因此未来年份在官方公布前会显示为空白（不影响农历显示）。届时只需升级依赖：
   ```bash
   npm install lunar-javascript@latest
   ```
   即可自动获得新一年的节假日数据，无需修改任何业务代码。
2. **毛玻璃效果**：使用 CSS `backdrop-filter` 模拟磨砂质感，而不是 Windows 原生 Acrylic 效果，兼容性和稳定性更好，视觉上已经比较接近 macOS 小组件 / Notion 的观感。
3. **多显示器**：窗口位置会记住上一次退出前的坐标，如果之后拔掉了某台显示器导致窗口"跑到屏幕外"，可以删除数据文件中 `settings.windowBounds` 字段（或直接删掉 app-data.json 让它用默认值重新生成）来重置窗口位置。

## 错误处理与空状态说明

- 待办/备忘录的增删改查采用"乐观更新 + 失败回滚"策略：界面先立即响应，本地文件写入失败时会自动撤销这次界面变化并弹出提示，不会出现"看起来保存成功但其实丢失"的情况。
- 数据加载失败、导入文件格式不正确等场景都有明确的失败提示（而不是静默失败或白屏）。
- 待办、备忘录列表为空时会展示引导性的空状态提示，而不是一片空白。
