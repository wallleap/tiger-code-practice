# 虎码字根练习 (Tiger Code Radical Practice)

这是一个基于 Web 的虎码字根练习工具，包含字根练习和字根表查询功能。

## 功能特点

- **字根练习**：随机或顺序练习虎码字根，支持自动提示和进度保存。
- **字根表**：完整的虎码字根表，包含键盘分区视图，支持拼音和例字查看。
- **本地存储**：自动保存练习进度和设置，刷新页面不丢失。
- **响应式设计**：适配桌面和移动设备。

## 目录结构

- `index.html`: 练习主页
- `table.html`: 字根表页面
- `data/`: 存放字根数据文件
- `fonts/`: 存放 TumanPUA 字体文件
- `server.js`: 本地开发用的简单 HTTP 服务器
- `scrape_radicals.js`: 用于抓取/处理字根数据的脚本

## 如何在本地运行

1. 确保安装了 [Node.js](https://nodejs.org/)。
2. 在项目根目录运行：
   ```bash
   node server.js
   ```
3. 打开浏览器访问 `http://localhost:8080`。

## 如何部署到 GitHub Pages

本项目是一个静态网站，非常适合部署在 **GitHub Pages** 上。请按照以下步骤操作：

1. **创建仓库**：
   - 登录 GitHub，创建一个新的仓库（Repository），例如命名为 `zhmn-practice`。

2. **上传代码**：
   - 将本项目的所有文件上传到该 GitHub 仓库中。（可以使用 Git 命令或直接在网页上传）
   - 确保 `index.html` 位于仓库的根目录。

3. **开启 GitHub Pages**：
   - 进入仓库页面，点击顶部的 **Settings**（设置）。
   - 在左侧菜单栏找到 **Pages**。
   - 在 **Build and deployment** 下的 **Source** 选择 **Deploy from a branch**。
   - 在 **Branch** 选项中，选择 `main` (或 `master`) 分支，文件夹选择 `/ (root)`。
   - 点击 **Save**（保存）。

4. **访问网站**：
   - 等待几分钟后，刷新页面，你会在顶部看到类似 `https://your-username.github.io/zhmn-practice/` 的链接。
   - 点击链接即可访问你的在线字根练习工具。

## 数据更新

如果你需要更新字根数据，请修改 `data/虎码字根.txt` 文件。格式如下（使用制表符分隔）：
```text
字根(含变体)	编码	[拼音]
```
例如：
```text
疒	ab	[nè]
```
