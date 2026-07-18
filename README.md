# 📊 Repo-rter

[🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇨🇳 中文](README.zh.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇸🇦 العربية](README.ar.md) | [🇷🇺 Русский](README.ru.md) | [🇵🇹 Português](README.pt.md) | [🇮🇩 Bahasa Indonesia](README.id.md) | [🇩🇪 Deutsch](README.de.md) | [🇯🇵 日本語](README.ja.md)

---

<div align="center">
  <img src="./public/logo.png" width="120" style="margin-bottom: 20px;" />

  <h3>A local-first, lightweight desktop dashboard to permanently save your GitHub repository traffic insights & release download stats.</h3>

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
| **Repository Details** | **Release Downloads & Metrics** |
| <img src="./public/screenshots/repo_traffic.png" width="400"/> | <img src="./public/screenshots/details.png" width="400"/> |

---

## 💡 Why Repo-rter?

If you maintain open-source software on GitHub, you probably love checking your repository's traffic insights. However, two things are incredibly frustrating:

1. **The 14-Day Cliff**: GitHub only stores your traffic stats (views, clones, and referrers) for exactly 14 days. If you don't check or manually log them inside that window, that data is gone forever.
2. **The Multi-Repo Chore**: To check multiple repositories, you have to click through "Insights" -> "Traffic" for every single repository in your browser. 

I didn't want to pay for a monthly SaaS subscription just to keep my own traffic history, and I didn't want to run complex scraper cron-jobs on a server. So, I built **Repo-rter**—a local-first, lightweight desktop application that solves this once and for all.

---

## ⚙️ How It Works

Repo-rter runs quietly on your local machine and acts as a caching layer between you and the GitHub API:

* **Local Merging**: When the app fetches data, it merges new views/clones with your local SQLite/local-storage database. It prevents duplicates using unique date keys, meaning you build an infinite historical timeline over time.
* **Background Scheduler**: Tauri launches a local cron job that periodically syncs data in the background, so you don't even need to keep the app interface open.
* **Privacy by Design**: Your GitHub Personal Access Token (PAT) is stored strictly on your local machine. No external servers or 3rd-party databases are involved.

---

## ✨ Features

- **Infinite History Caching**: Keep your view, clone, and referrer data forever by caching it locally.
- **Release Downloads Tracker**: Monitor the exact download count for each release asset (`.exe`, `.dmg`, `.deb`, etc.) across all versions.
- **Unified Global Dashboard**: Monitor all your repositories' combined stars, forks, and traffic trends in one view.
- **Export Reports**: Generate clean, ready-to-share Markdown reports of your repository metrics with a single click.
- **Tauri-Powered Performance**: Extremely fast and lightweight (~15MB bundle size) with minimal RAM usage.
- **Vibrant Neo-Brutalist UI**: An interface styled to be fun, responsive, and delightful to use.

---

## ⬇️ Installation & Setup

### 1. Download the App
Grab the latest installer for your OS from the [Releases page](https://github.com/RAKKUNN/Repo-rter/releases/latest):
* **macOS**: `Repo-rter_x.x.x_aarch64.dmg` (Apple Silicon) or `x64.dmg` (Intel)
* **Windows**: `Repo-rter_x.x.x_x64-setup.exe`
* **Linux**: `repo-rter_x.x.x_amd64.deb`

### 2. Configure your GitHub Token
To fetch traffic data, the app requires a Personal Access Token (PAT):
1. Go to your GitHub account -> **Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Fine-grained tokens**.
2. Click **Generate new token**.
3. Grant **Read-only** permissions for:
   * **Metadata** (Repository details)
   * **Administration** (Required by GitHub's API to access traffic data)
4. Copy the generated token, paste it into Repo-rter, and you are ready to go!

---

## 🙋 FAQ

#### Q. Why does the token require "Administration" permissions?
Unfortunately, this is a limitation of the GitHub API. GitHub restricts access to the `/traffic` endpoint exclusively to repository owners or administrators. To fetch traffic data, the token must have read-level access to administration. Repo-rter is 100% open-source, so you can inspect the code to verify that your token is never misused.

#### Q. Where is my traffic data stored?
All data is cached locally in your system's application data folder, secured by your OS. Your token is only used to send direct HTTPS requests to `api.github.com`.

#### Q. What happens if I hit the GitHub API Rate Limit?
Repo-rter uses optimized background sync intervals to prevent rate limits. If you have many repositories and hit a limit, the app will gracefully pause and resume syncing once GitHub resets the limit.

---

## 🗺️ Roadmap

- [x] Release asset download stats tracking
- [x] Markdown report exporting
- [ ] Discord/Telegram Webhook notification alerts (e.g. notify when star/download milestones are hit)
- [ ] Offline interactive chart zooming & granular date filtering
- [ ] Integration with GitHub Actions for headless syncing

---

## 💻 Local Development

### Prerequisites
- Node.js (v18 or newer)
- Rust (latest stable)
- System build dependencies (e.g., Xcode on macOS, C++ Build Tools on Windows).

### Run in Dev Mode
```bash
git clone https://github.com/RAKKUNN/Repo-rter.git
cd Repo-rter
npm install
npm run tauri dev
```

### Build Production Bundle
```bash
npm run tauri build
```

---

## ❤️ Contributions & Support

Contributions are always welcome! If you find a bug, have an idea, or want to add a translation, feel free to open an Issue or submit a Pull Request.

If Repo-rter saved your historical stats, please consider **starring the repository ⭐** or [sponsoring the project](https://github.com/sponsors/RAKKUNN)!

## 📝 Changelog

### v0.4.5
- Fixed the settings modal disappearing instantly on close instead of animating out.
- Added `prefers-reduced-motion` support so animations are minimized for users who request reduced motion in their OS settings.

### v0.4.4
- Moved the GitHub token, WebDAV password, and E2EE passphrase out of browser `localStorage` into the OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- Existing plaintext secrets are migrated automatically on first launch. The keychain copy is written and read back before the plaintext is removed.
- Sync settings now save when you leave the field instead of on every keystroke.

### v0.4.3
- Fixed background sync never running — the scheduler looked up a token key that no code ever wrote, so every cycle exited early since the initial release.
- Moved Tauri crates from release candidates to stable, aligning the Rust side with the already-stable JS packages (minimum Rust version is now 1.77.2).
- Split the 742-line translation file into per-language modules under `src/lib/locales/`. No translation content changed.
- Added test coverage for traffic merging on both the Rust and TypeScript paths: date deduplication, chronological ordering, and retention of history past GitHub's 14-day window.

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

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
