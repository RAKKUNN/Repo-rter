# About Repo-rter

> **Repo-rter** is a privacy-first, local-first desktop application designed to permanently capture, store, and visualize GitHub repository traffic and release analytics—bypassing GitHub's native 14-day history limit.

---

## 💡 The Problem

GitHub's native **Insights > Traffic** tab provides valuable visitor views and clone metrics for open-source maintainers. However, it suffers from a major design limitation:

- **14-Day Expiration**: GitHub automatically deletes traffic logs older than 14 days without warning.
- **No Historical Retention**: Unless maintainers manually export CSV files every two weeks or pay for external 3rd-party SaaS services, long-term traffic trends and growth insights are permanently lost.
- **Privacy Trade-offs in SaaS**: Using 3rd-party web analytics services requires sharing full-access GitHub Personal Access Tokens (PATs) with external servers—creating a major security risk for maintainers.

---

## 🚀 The Solution: Local-First Architecture

Repo-rter was created to solve these challenges without compromising maintainer privacy. It runs locally on your desktop machine, periodically fetching traffic data in the background and merging incoming statistics with your persistent local database.

### Core Principles

1. **Local-First & Offline-Capable**
   All historical traffic records, clone stats, and release metrics are stored locally on your machine's native filesystem (`app_data_dir`). Your data remains 100% under your ownership.

2. **Zero Central Servers (Privacy-First)**
   Repo-rter does not run intermediate tracking servers or telemetry engines. API requests flow directly from your machine to `api.github.com`.

3. **Hardware-Grade Credential Protection**
   Sensitive credentials (GitHub PATs, cloud passwords, encryption passphrases) are never stored as plaintext files. They are managed natively via OS Keychains (macOS Keychain, Windows Credential Manager, Linux Secret Service).

4. **Zero-Knowledge Multi-Device Sync**
   Need to sync your dashboard between your laptop and desktop? Repo-rter supports WebDAV synchronization using **AES-256-GCM End-to-End Encryption (E2EE)**. Cloud storage providers only ever see encrypted ciphertext.

---

## 🛠️ Technology Stack

Repo-rter is engineered with modern, high-performance web and native technologies:

- **Desktop Framework**: [Tauri v2](https://tauri.app/) (Lightweight native window wrapper, ~15MB installer size).
- **Frontend Logic**: [Next.js 16](https://nextjs.org/) (Static HTML Export mode) & [React 19](https://react.dev/).
- **Native Backend**: [Rust](https://www.rust-lang.org/) (Native filesystem I/O, `keyring` OS integration, zero-dependency date filtering).
- **Cryptography**: Web Crypto API (AES-256-GCM, PBKDF2 100,000 iterations).
- **Styling & UI**: Tailwind CSS (Neo-brutalist dark/light design system), Framer Motion.

---

## 📊 Feature Highlights

- **Infinite Traffic Retention**: Merges 14-day rolling windows into chronological time-series records without data loss.
- **Release Download Tracking**: Tracks individual asset download counts (`.exe`, `.dmg`, `.deb`, `.zip`) across all releases over time.
- **Rotational Background Sync**: Respects GitHub PAT rate limits (5,000 req/hr) by rotating through repositories in background batches.
- **Custom Retention Policies**: Configurable data retention periods (30 days, 90 days, 1 year, or forever) with native Rust auto-purging.
- **Markdown Report Generator**: Export comprehensive health and traffic summaries in one click for team sharing or blog posts.

---

## 🤝 Maintainer & License

Repo-rter is created and maintained by **[@RAKKUNN](https://github.com/RAKKUNN)** and the open-source community.

Released under the **MIT License**. Free forever for individual developers, teams, and open-source maintainers.
