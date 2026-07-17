# 📊 Repo-rter

[🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇨🇳 中文](README.zh.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇸🇦 العربية](README.ar.md) | [🇷🇺 Русский](README.ru.md) | [🇵🇹 Português](README.pt.md) | [🇮🇩 Bahasa Indonesia](README.id.md) | [🇩🇪 Deutsch](README.de.md) | [🇯🇵 日本語](README.ja.md)

---

<div align="center">
  <img src="./public/logo.png" width="120" style="margin-bottom: 20px;" />

  <h3>一个美丽、新粗野主义/像素艺术风格的 GitHub 流量分析工具，使用 Tauri 和 Next.js 构建。</h3>

  [![Product Hunt](https://img.shields.io/badge/Product_Hunt-Featured-orange?logo=product-hunt&style=for-the-badge)](https://www.producthunt.com/products/reporter-2)
  [![GitHub release](https://img.shields.io/github/v/release/RAKKUNN/Repo-rter?style=for-the-badge&color=green)](https://github.com/RAKKUNN/Repo-rter/releases)
  [![GitHub stars](https://img.shields.io/github/stars/RAKKUNN/Repo-rter?style=for-the-badge&color=yellow)](https://github.com/RAKKUNN/Repo-rter/stargazers)
  [![GitHub license](https://img.shields.io/github/license/RAKKUNN/Repo-rter?style=for-the-badge&color=blue)](https://github.com/RAKKUNN/Repo-rter/blob/main/LICENSE)
  [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge)](https://github.com/RAKKUNN/Repo-rter/releases)
</div>

<br />

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

## 📝 Changelog

### v0.4.2
- Added WebDAV cloud synchronization for backing up and restoring traffic logs across machines.
- Implemented AES-256-GCM End-to-End Encryption (E2EE) using Web Crypto API to secure remote backups.
- Added native Rust bundle commands to optimize sync payload building and cache merging.

### v0.4.1
- Added custom Data Retention Policy settings (auto-purging old traffic history).
- Dynamically synchronized version strings inside the Settings About panel with package configuration.

### v0.4.0
- Migrated traffic cache from `localStorage` to native OS file storage (safe from system cache purges).
- Added JSON backup data import feature to restore stats across devices.
- Improved background sync with sliding-window repository rotation (safely syncs all repositories over time).
- Refactored documentation and project structure for production-ready open-source packaging.

### v0.3.0
- Added release asset download statistics tracking.
- Added Markdown report exporting (views, clones, referrers, paths, languages).

### v0.2.0
- Initial open-source release.
- Core traffic tracking (views, clones, paths, referrers).
- Multi-language support (12 languages).
- Neo-Brutalist UI and system tray background syncing.
