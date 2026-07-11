# 📊 Repo-rter

[🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇨🇳 中文](README.zh.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇸🇦 العربية](README.ar.md) | [🇷🇺 Русский](README.ru.md) | [🇵🇹 Português](README.pt.md) | [🇮🇩 Bahasa Indonesia](README.id.md) | [🇩🇪 Deutsch](README.de.md) | [🇯🇵 日本語](README.ja.md)

---

A beautiful, neo-brutalist / pixel-art GitHub traffic analytics tool built with Tauri and Next.js.

<div align="center">
  <img src="./public/logo.png" width="100" />
</div>

## 📸 Screenshots

| Dashboard Overview | Global Traffic Timeline |
| :---: | :---: |
| <img src="./public/screenshots/overview.png" width="400"/> | <img src="./public/screenshots/global_traffic.png" width="400"/> |
| **Repository Details** | **Analytics Breakdown** |
| <img src="./public/screenshots/repo_traffic.png" width="400"/> | <img src="./public/screenshots/details.png" width="400"/> |

## 📖 About Repo-rter
GitHub only provides 14 days of traffic analytics for your repositories. Repo-rter solves this by continuously running in the background of your desktop to infinitely track and store your repository views, clones, and stars locally. You never lose your data again!

## 🚀 Features
- 📈 Track GitHub traffic infinitely (bypassing the 14-day limit)
- 🎨 Neo-brutalist / Pixel-art UI
- 🔄 Desktop app with system tray & background syncing via Cron
- 💾 Export data to CSV and JSON
- 🌐 Supports 12 languages

## 🛠️ Technology Stack
- **Frontend**: Next.js (Static Export), React, TailwindCSS
- **Backend**: Tauri (Rust)
- **State Management**: React Query with offline local storage caching
- **Deployment**: GitHub Actions for cross-platform automated release building

## 💻 Getting Started (Local Development)

### Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- OS-specific build dependencies (e.g., Xcode for macOS, C++ Build Tools for Windows, `libwebkit2gtk-4.0-dev` for Linux).

### Installation
1. **Clone the repository:**
```bash
git clone https://github.com/RAKKUNN/Repo-rter.git
cd Repo-rter
```
2. **Install Node.js dependencies:**
```bash
npm install
```
3. **Run the development server:**
This will start both the Next.js frontend and the Tauri Rust backend simultaneously.
```bash
npm run tauri dev
```
4. **Build for production:**
```bash
npm run tauri build
```

## ❤️ Support
If you find this project useful, please consider [sponsoring me on GitHub](https://github.com/sponsors/RAKKUNN) or starring the repository!
