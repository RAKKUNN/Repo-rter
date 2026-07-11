# 📊 Repo-rter

[🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇨🇳 中文](README.zh.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇸🇦 العربية](README.ar.md) | [🇷🇺 Русский](README.ru.md) | [🇵🇹 Português](README.pt.md) | [🇮🇩 Bahasa Indonesia](README.id.md) | [🇩🇪 Deutsch](README.de.md) | [🇯🇵 日本語](README.ja.md)

---

一个美丽、新粗野主义/像素艺术风格的 GitHub 流量分析工具，使用 Tauri 和 Next.js 构建。

<div align="center">
  <img src="./public/logo.png" width="100" />
</div>

## 📸 Screenshots

| Dashboard Overview | Global Traffic Timeline |
| :---: | :---: |
| <img src="./public/screenshots/overview.png" width="400"/> | <img src="./public/screenshots/global_traffic.png" width="400"/> |
| **Repository Details** | **Analytics Breakdown** |
| <img src="./public/screenshots/repo_traffic.png" width="400"/> | <img src="./public/screenshots/details.png" width="400"/> |

## 📖 关于 Repo-rter
GitHub 仅提供 14 天的流量数据。Repo-rter 在后台持续运行，无限期地跟踪并将数据保存在本地。

## 🚀 功能
- 📈 无限跟踪 GitHub 流量（绕过 14 天限制）
- 🎨 新粗野主义 / 像素艺术 UI
- 🔄 带有系统托盘和后台同步的桌面应用
- 💾 将数据导出为 CSV 和 JSON
- 🌐 支持 12 种语言

## 🛠️ 技术栈
- **前端**: Next.js, React, TailwindCSS
- **后端**: Tauri (Rust)

## ⬇️ 安装使用
您无需从源码构建！只需下载安装程序：
1. 前往 [Releases 页面](https://github.com/RAKKUNN/Repo-rter/releases/latest)。
2. 下载适合您系统的安装包 (.dmg, .exe, .deb)。
3. 运行安装程序。

## 💻 本地开发 (面向开发者)

### 先决条件
在开始之前，请确保已安装：
- [Node.js](https://nodejs.org/) (v18 或更新版本)
- [Rust](https://www.rust-lang.org/tools/install) (最新稳定版)
- 操作系统特定的构建依赖项（例如 macOS 的 Xcode，Windows 的 C++ Build Tools，Linux 的 `libwebkit2gtk-4.0-dev`）。

### 构建与运行
1. **克隆仓库：**
```bash
git clone https://github.com/RAKKUNN/Repo-rter.git
cd Repo-rter
```
2. **安装依赖项：**
```bash
npm install
```
3. **运行开发服务器：**
```bash
npm run tauri dev
```
4. **打包应用：**
```bash
npm run tauri build
```

## ❤️ 支持与赞助
如果您觉得这个项目有用，请考虑在 [GitHub Sponsors](https://github.com/sponsors/RAKKUNN) 上赞助我！
