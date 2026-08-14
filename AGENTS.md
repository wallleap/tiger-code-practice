# 虎码字根练习 (Tiger Code Radical Practice)

虎码输入法字根练习工具：纯静态 Web 应用（无框架、无构建步骤），含字根练习页和字根表查询页。

## Project

- 纯 HTML/CSS/JS 静态站点，无 package.json、无依赖、无构建；本地用 `server.js`（Node 内置 http）起服务。
- 入口：`index.html`（练习页，inline CSS+JS）、`table.html`（字根表/键盘分区视图，支持拼音与例字搜索）、`split.html`（拆分查询：每字同时显示虎码与 86/98/新世纪五笔的拆分与编码）。
- 数据：`data/虎码字根.txt`（主数据，练习与字根表都 fetch 它）；`data/zhmnwhei.txt`（从 tiger-code.com 抓取的增强数据，含例字）；`data/单字编码.txt`（单字→编码映射）；`data/hu_cf.txt`（拆分查询的虎码拆分）；`data/zi_py.txt`（拆分查询的拼音）；`data/86_ws.txt`、`data/98_ws.txt`、`data/06_ws.txt`（拆分查询的五笔拆分）。每个 `.txt` 旁配有 `.txt.gz` 预压缩版（GitHub Pages 不 gzip），页面用 `fetchText()` 优先加载并 `DecompressionStream` 解压，失败回落原文件。
- 字体：`fonts/` 下的 TumanPUA（虎码自造字根字体）、WubiPUA（五笔自造字根字体）、PingFang-Mod.otf，`base.css` 统一通过 `@font-face` 引用。
- 缓存：`sw.js`（Service Worker，三页底部注册），运行时缓存——`/fonts/*` cache-first、`/data/*` 与页面/app 资源 network-first（离线回落缓存）；`activate` 后延迟 5s 兜底预缓存，页面加载后空闲时（`requestIdleCallback`，无则 `setTimeout` 兜底，首次加载等 `controllerchange`）向 SW `postMessage({type:'PRECACHE'})` 触发 `precacheAll()` 并发（3 路，in-flight 去重共享下载）预缓存 `PRECACHE_FONTS`/`PRECACHE_DATA` 列表（字根、单字、拼音、拆分、五笔数据的 `.gz` 版）。SW 通过 `{type:'PRECACHE_PROGRESS', done/total/failed}` 回传进度，三页的 `setupCacheProgress()` 显示顶部缓存进度条。新增数据/字体文件时记得加入对应列表。
- 部署：GitHub Pages，push 到 `main` 触发 `.github/workflows/static.yml`，上传仓库根目录。

## Commands

- 本地运行：`npx nodemon server.js` → 自动打开 `http://localhost:8080`（页面用相对路径 fetch 数据，直接开 file:// 不可用）
- 抓取字根数据：`node scrape_radicals.js`（写 `data/zhmnwhei.txt`）
- 压缩数据：改过 `data/*.txt` 后运行 `node gzip_data.js` 重新生成 `data/*.txt.gz`（页面优先加载 .gz）
- 无测试、无 lint、无构建命令。

## Architecture

- `index.html`：练习页，支持**字根练习 / 单字练习**两种模式（`DATA_FILES` 映射数据源，`switchMode()` 切换并清旧进度）。核心流程 `initApp()` → `loadData()` → `parseData()` → `nextRoot()`/`checkInput()`；答错进 `wrongRoots`，一轮结束自动复习错题；空格键一次性提示。单字编码（`data/单字编码.txt`）形如 `的\tu_`，`checkInput` 中结尾 `_`（补码占位）可省略输入。
- `dbService`（index.html 内联）：IndexedDB 封装，库 `ZhmnPracticeDB`（version 1），store `app_data`。键 `settings`（全局：当前模式 `mode`）与 `settings:{mode}`（各模式的乱序/提示设置，`applyModeSettings()` 应用）、`session:{mode}`（各模式进度分 key 独立存储，切换模式不丢进度；`switchMode()` 先存当前进度再恢复目标进度）。
- `table.html`：字根表页，`renderGrid()`（列表）+ `renderKeyboard()`（按编码首字母分组）+ `filterGrid()` 搜索。
- `split.html`：拆分查询页，`parseHu()`（虎码拆分）、`parseWubi()`（五笔拆分，`WubiPUA` 字体渲染 PUA 字根）、`parsePinyin()`（拼音）；`METHODS` 定义展示顺序（虎码/86/98/新世纪），`methodRow()` 逐字生成各行，拼音主用 `zi_py.txt`，缺失时回退到五笔文件的拼音字段。加载策略：先并行加载 `hu_cf.txt.gz`+`zi_py.txt.gz`（`<link rel=preload>` 预取）渲染虎码结果，三个五笔文件在首次输入时才懒加载、各自完成即增量重渲染；`.progress-bar` 按 gzip 字节数显示进度。
- `parseData()`（两个页面各有一份，保持同步修改）：按空白拆分行，末段形如 `[拼音]` 则识别为拼音，其余为 `字根(含变体)` + `编码`。
- `sw.js`：Service Worker，`install` 时 `skipWaiting`、`activate` 时清非 `ACTIVE_CACHES` 里的旧缓存（含历史版本号 `tiger-*`）并 `clients.claim`，随后延迟 5s 兜底预缓存；并监听页面 `message`（`{type:'PRECACHE'}`）用 `e.waitUntil` 保活触发 `precacheAll(onProgress)`（并发 3 路，in-flight 去重共享下载；先筛出缺失项，已缓存项直接跳过、不计数不上报，避免切换页面闪现进度条）预缓存 `PRECACHE_FONTS`（→`tiger-fonts-v1`）和 `PRECACHE_DATA`（`data/*.txt.gz` →`tiger-data-v1`），单文件失败只跳过、下次触发重试；预缓存期间向发起页面（`e.source.postMessage`）广播 `{type:'PRECACHE_PROGRESS', done/total/failed}`，`activate` 兜底预缓存则发给所有 window client；`fetch` 中 `/fonts/*`（或 `.ttf/.otf/.woff`）cache-first、`/data/*`（或 `.txt`）与其余页面/app 资源 network-first——`fetchAndCache(url, cache, {networkFirst:true})` 先 `fetch`（成功且 ok 则更新缓存）再回落缓存，**联网时始终最新，日常提交无需 bump 版本号**；`cacheFirst`/`precacheAll` 走默认 cache-first（缓存命中则预缓存也不会重复下载）。缓存名 `tiger-fonts-v1`/`tiger-data-v1`/`tiger-app-v1`：**替换字体文件后仍需手动 bump `FONT_CACHE` 版本号**（字体 cache-first 不会自动更新）；bump 后 `activate` 自动清理旧版本 `tiger-*` 缓存。
- `server.js`：极简静态服务器，MIME 表 + 404 兜底；`scrape_radicals.js`：抓取 tiger-code.com 对比表生成数据。

## Conventions

- 字根数据格式：`字根(含变体) 编码 [拼音]`，空白/制表符分隔，**两页的 `parseData` 依赖此格式**——改数据文件时保持兼容。
- 单字编码格式：`文字	编码`，其中编码全码为4码（例 `tjkf`），不足4码的后面加 `_`，实际输入时可忽略，编码末尾的数字可忽略。
- 拆分查询数据格式（`split.html` 的 `parseHu`/`parsePinyin`/`parseWubi` 依赖，改文件时保持兼容）：
  - 虎码拆分 `data/hu_cf.txt`：`字\t〔拆分字根&nbsp;·&nbsp;编码〕`（多字根用 `&nbsp;` 分隔）。
  - 拼音 `data/zi_py.txt`：`字\t（拼音）`，多音用 `&nbsp;` 分隔；拆分查询页主用它，缺失时回退到五笔文件自带的拼音字段（`_` 分隔）。
  - 五笔拆分 `data/86_ws.txt` / `data/98_ws.txt` / `data/06_ws.txt`：`字\t[※拆分※,※编码※,※拼音(可选)※,※字符集※]`，拆分字段内每个字根以 `※` 分隔，PUA 字形用 `WubiPUA` 字体渲染。
- 页面用 inline `<script>`/`<style>`，2 空格缩进，单引号，中文注释与中文 UI 文案。
- 处理汉字/变体用 `Array.from()` 按 Unicode 码点切分（见 `updateRootDisplayContent`），不要用索引下标。
- 字体和 CSS 变量（`--primary-color` 等 indigo 玻璃拟态主题）集中定义在 `<style>` 头部。

## Notes

- （待补充）
