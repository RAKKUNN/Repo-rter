# Changelog

All notable changes to the **Repo-rter** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.5.0] - 2026-11-13

### Security
- Enabled strict WebView Content Security Policy (CSP) in `tauri.conf.json` and refined Tauri HTTP capabilities (`default.json`).
- Added Rust IPC path-traversal sanitization (`sanitize_repo_key`), `data_type` whitelisting (`views` / `clones`), and OS Keychain secret key whitelisting (`ALLOWED_SECRET_KEYS`).
- Enforced fail-closed AES-256-GCM encryption/decryption in `crypto.ts` (preventing plaintext WebDAV uploads when passphrases are missing) and HTTPS protocol verification for remote WebDAV endpoints.

### Performance
- Implemented atomic file writes (`.json.tmp` + `fs::rename`) in Rust storage to prevent JSON corruption on abrupt termination.
- Added process-wide `Mutex` in-memory secret caching in Rust and in-flight Promise deduplication in TypeScript to eliminate redundant OS Keychain access prompts on startup.
- Removed unused `getRepoIssues` queries, optimized `getRepoPulls` payload (`state=open`), implemented 8KB chunked Base64 encoding, and added React Query `staleTime` caching with sidebar hover prefetching (`onMouseEnter`).
- Fixed JSON/CSV Data Export in Settings to export all persisted repositories from disk (`loadAllBundledTraffic`) instead of only in-memory visited caches.

### Added
- **22 UI Design Style Themes Studio**: Added 22 curated themes across Mainstream (Flat Notion/Spotify, Material You, Fluent Acrylic, Apple HIG, Glassmorphism), Popular (Neumorphism Light/Dark, Minimal MUJI, OLED True Black, Card Bento, Stripe Gradient), Special Purpose (Neubrutalism Light/Dark, Typographic Editorial, 90s Raw Brutalism, 3D Depth, Isometric Blueprint, Claymorphism, Aurora Mesh), and Retro (Frutiger Aero, Skeuomorphism) inside Settings.
- **Interactive Overview Contextual Breakdowns**: Clicking `Total Stars`, `Total Forks`, or `Total Repos` in Global Overview switches instantly into dedicated Star Share, Fork-to-Star Ecosystem, and Portfolio Language/License/Size Inventory panels.
- **Upgraded Languages & Repository Pulse**: Replaced Echo Locator with **Repository Pulse & Recent Commits** (with repo size, license, and push badges), upgraded the **Languages** panel with a GitHub-style stacked progress bar + center-summary Donut chart + byte/share breakdown, and added **OS Platform Download Share** (macOS / Windows / Linux %) to Releases.
- **Interactive Traffic Charts & Manual Refresh**: Added date-range pills (`7D`/`14D`/`30D`/`90D`/`ALL`), `Area`/`Bar` mode toggle, `Total`/`Unique` metric switches, peak-day badges, and an instant `Refresh Now` (`Cmd/Ctrl + R`) control.

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
