# 虎码字根练习 (Tiger Code Radical Practice)

虎码输入法字根练习工具：纯静态 Web 应用（无框架、无构建步骤），含字根练习页和字根表查询页。

## Project

- 纯 HTML/CSS/JS 静态站点，无 package.json、无依赖、无构建；本地用 `server.js`（Node 内置 http）起服务。
- 入口：`index.html`（练习页，inline CSS+JS）、`table.html`（字根表/键盘分区视图，支持拼音与例字搜索）。
- 数据：`data/虎码字根.txt`（主数据，练习与字根表都 fetch 它）；`data/zhmnwhei.txt`（从 tiger-code.com 抓取的增强数据，含例字）；`data/单字编码.txt`（单字→编码映射）。
- 字体：`fonts/` 下的 TumanPUA（自造字根字体）、PingFang-Mod.otf，页面通过 `@font-face` 引用。
- 部署：GitHub Pages，push 到 `main` 触发 `.github/workflows/static.yml`，上传仓库根目录。

## Commands

- 本地运行：`npx nodemon server.js` → 自动打开 `http://localhost:8080`（页面用相对路径 fetch 数据，直接开 file:// 不可用）
- 抓取字根数据：`node scrape_radicals.js`（写 `data/zhmnwhei.txt`）
- 无测试、无 lint、无构建命令。

## Architecture

- `index.html`：练习页。核心流程 `initApp()` → `parseData()` → `nextRoot()`/`checkInput()`；答错进 `wrongRoots`，一轮结束自动复习错题；空格键一次性提示。
- `dbService`（index.html 内联）：IndexedDB 封装，库 `ZhmnPracticeDB`（version 1），store `app_data`，键 `session`（进度）和 `settings`（随机模式/自动提示）。
- `table.html`：字根表页，`renderGrid()`（列表）+ `renderKeyboard()`（按编码首字母分组）+ `filterGrid()` 搜索。
- `parseData()`（两个页面各有一份，保持同步修改）：按空白拆分行，末段形如 `[拼音]` 则识别为拼音，其余为 `字根(含变体)` + `编码`。
- `server.js`：极简静态服务器，MIME 表 + 404 兜底；`scrape_radicals.js`：抓取 tiger-code.com 对比表生成数据。

## Conventions

- 字根数据格式：`字根(含变体) 编码 [拼音]`，空白/制表符分隔，**两页的 `parseData` 依赖此格式**——改数据文件时保持兼容。
- 单字编码格式：`文字	编码`，其中编码全码为4码（例 `tjkf`），不足4码的后面加 `_`，实际输入时可忽略。
- 页面用 inline `<script>`/`<style>`，2 空格缩进，单引号，中文注释与中文 UI 文案。
- 处理汉字/变体用 `Array.from()` 按 Unicode 码点切分（见 `updateRootDisplayContent`），不要用索引下标。
- 字体和 CSS 变量（`--primary-color` 等 indigo 玻璃拟态主题）集中定义在 `<style>` 头部。

## Notes

- （待补充）
