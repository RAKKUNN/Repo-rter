# Changelog

All notable changes to the **Repo-rter** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.5] - 2026-07-18

### Fixed
- Resolved issue where the settings modal vanished instantly on close instead of completing exit transition animations.

### Added
- Added full `prefers-reduced-motion` OS accessibility support across CSS transitions and Framer Motion modal popups.
- Refreshed GitHub Pages landing page (`docs/`) with a responsive Bento Grid design, self-hosted privacy-first fonts, and scroll-reveal interactions.

---

## [0.4.4] - 2026-07-17

### Security
- Migrated GitHub PATs, WebDAV passwords, and E2EE passphrases out of browser `localStorage` into OS Native Keychains (macOS Keychain, Windows Credential Manager, Linux Secret Service API) via pure Rust `keyring` integration.
- Added startup transaction-like secret migration: plaintext keys are copied to keychain, verified via read-back, and purged from browser storage only upon 1:1 match confirmation.

### Fixed
- Fixed password input fields in `SettingsModal` saving on every keystroke (`onChange`), shifting persistence to `onBlur` to eliminate race conditions and OS Keychain API overhead.

---

## [0.4.3] - 2026-07-17

### Fixed
- Fixed background sync scheduler exiting early on every cycle due to mismatched credential lookup keys.

### Changed
- Upgraded Tauri dependencies from Release Candidates (`2.0.0-rc.17`) to stable production releases (`2.11.5`).
- Modularized 700+ lines of translation files into per-language modules under `src/lib/locales/`.

### Added
- Added Vitest + JSDOM unit test suite covering TypeScript and Rust data merging, date deduplication, and auth token gateway logic.

---

## [0.4.2] - 2026-07-17

### Added
- Added WebDAV multi-device cloud synchronization.
- Implemented client-side AES-256-GCM End-to-End Encryption (E2EE) using Web Crypto API and PBKDF2 (100,000 iterations).
- Added native Rust `bundle_traffic_cache` command to pack filesystem JSON files into single compact payloads for WebDAV upload.

---

## [0.4.1] - 2026-07-14

### Added
- Added Custom Data Retention Policies (`30 days`, `90 days`, `180 days`, `1 year`, `forever`).
- Added zero-dependency Rust date filtering engine for native auto-purging.

### Changed
- Migrated primary storage layer from WebView `localStorage` to native Rust filesystem (`app_data_dir`) to protect data against OS cache sweeps and 5MB storage limits.
- Configured dynamic version importing from `package.json` across About UI dialogs.

---

## [0.4.0] - 2026-07-11

### Added
- Added automated background sync scheduler with rotational batching to respect GitHub API rate limits (5,000 req/hr).
- Added Release Download tracking for asset files (`.dmg`, `.exe`, `.deb`, `.zip`).

---

## [0.3.0] - 2026-07-08

### Added
- Added Markdown report generation for one-click health summaries.
- Added multi-repository overview dashboard and search filtering.

---

## [0.2.0] - 2026-07-01

### Added
- Initial public MVP release featuring 14-day traffic log capturing and Next.js + Tauri v2 container setup.
