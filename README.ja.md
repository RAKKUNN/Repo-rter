# 📊 Repo-rter

[🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇨🇳 中文](README.zh.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇸🇦 العربية](README.ar.md) | [🇷🇺 Русский](README.ru.md) | [🇵🇹 Português](README.pt.md) | [🇮🇩 Bahasa Indonesia](README.id.md) | [🇩🇪 Deutsch](README.de.md) | [🇯🇵 日本語](README.ja.md)

---

<div align="center">
  <img src="./public/logo.png" width="120" style="margin-bottom: 20px;" />

  <h3>美しくネオブルータリズムなGitHubトラフィック分析ツール。</h3>

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

## 📖 Repo-rter について
GitHubは14日間のデータしか提供しません。Repo-rterはデータをローカルに無期限で保存します。

## 🚀 機能
- 📈 無制限のトラフィック追跡
- 🎨 ピクセルアートUI
- 🔄 バックグラウンド同期
- 💾 CSV / JSON エクスポート
- 🌐 12言語対応

## 🛠️ 技術スタック
- **Frontend**: Next.js
- **Backend**: Tauri

## ⬇️ インストール方法
自分でビルドする必要はありません！
1. [Releases ページ](https://github.com/RAKKUNN/Repo-rter/releases/latest)にアクセスします。
2. OSに合ったインストーラー（.dmg, .exe, .deb）をダウンロードします。
3. インストーラーを実行してアプリを使用します。

## 💻 ローカル開発 (開発者向け)

### 必要なもの
- [Node.js](https://nodejs.org/) (v18以降)
- [Rust](https://www.rust-lang.org/tools/install) (最新版)
- OS固有のビルドツール

### ビルドと実行
1. **クローン:**
```bash
git clone https://github.com/RAKKUNN/Repo-rter.git
cd Repo-rter
```
2. **依存関係のインストール:**
```bash
npm install
```
3. **開発サーバーの起動:**
```bash
npm run tauri dev
```

## ❤️ スポンサー
このプロジェクトが役に立った場合は、[スポンサー](https://github.com/sponsors/RAKKUNN)を検討してください！

## 📝 Changelog

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
