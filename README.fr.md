# 📊 Repo-rter

[🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇨🇳 中文](README.zh.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇸🇦 العربية](README.ar.md) | [🇷🇺 Русский](README.ru.md) | [🇵🇹 Português](README.pt.md) | [🇮🇩 Bahasa Indonesia](README.id.md) | [🇩🇪 Deutsch](README.de.md) | [🇯🇵 日本語](README.ja.md)

---

<div align="center">
  <img src="./public/logo.png" width="120" style="margin-bottom: 20px;" />

  <h3>Un magnifique outil d'analyse de trafic GitHub construit avec Tauri et Next.js.</h3>

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

## 📖 À propos de Repo-rter
GitHub ne fournit que 14 jours de données. Repo-rter s'exécute en arrière-plan pour sauvegarder vos données indéfiniment.

## 🚀 Caractéristiques
- 📈 Suivi infini du trafic
- 🎨 Interface Néo-brutaliste
- 🔄 Synchronisation en arrière-plan
- 💾 Exportation CSV et JSON
- 🌐 12 langues

## 🛠️ Technologie
- **Frontend**: Next.js
- **Backend**: Tauri

## ⬇️ Installation
Téléchargez l'installateur (.exe, .dmg, .deb) depuis la [page Releases](https://github.com/RAKKUNN/Repo-rter/releases/latest).

## 💻 Développement Local

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- Dépendances du système (Xcode, C++ Build Tools, `libwebkit2gtk-4.0-dev`).

### Démarrer
1. **Cloner:**
```bash
git clone https://github.com/RAKKUNN/Repo-rter.git
cd Repo-rter
```
2. **Installer:**
```bash
npm install
```
3. **Démarrer:**
```bash
npm run tauri dev
```

## ❤️ Sponsoriser
Si ce projet vous est utile, envisagez de me [sponsoriser](https://github.com/sponsors/RAKKUNN)!

## 📝 Changelog

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
