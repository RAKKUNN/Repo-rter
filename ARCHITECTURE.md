# System Architecture & Technical Specifications

This document details the architectural design, system boundaries, IPC protocol, cryptography pipeline, and data flow of **Repo-rter**.

---

## 🏗️ High-Level System Architecture

Repo-rter is built as a **Local-First, Zero-Knowledge Desktop Client**. The application operates strictly within the host machine, making direct outbound calls to `api.github.com` and user-configured WebDAV endpoints without passing through any intermediate proxy or tracking servers.

```
+-------------------------------------------------------------------------+
|                        User's Host Machine                              |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |             Frontend Layer (WebView / Next.js 16)                 |  |
|  |  +------------------+  +-------------------+  +----------------+  |  |
|  |  | Dashboard UI     |  | Background Sync   |  | Web Crypto API |  |  |
|  |  | (React 19, CSS)  |  | Worker Scheduler  |  | (AES-256-GCM)  |  |  |
|  |  +--------+---------+  +---------+---------+  +-------+--------+  |  |
|  +-----------|----------------------|--------------------|-----------+  |
|              |                      |                    |              |
|              | Tauri IPC Bridge (invoke / async)         |              |
|              v                      v                    v              |
|  +-------------------------------------------------------------------+  |
|  |               Native Backend Layer (Tauri v2 / Rust)               |  |
|  |  +------------------+  +-------------------+  +----------------+  |  |
|  |  | Native File Storage| | OS Keyring Gateway| | Cache Bundler  |  |  |
|  |  | (app_data_dir)   |  | (Keychain/CredMgr)|  | Engine         |  |  |
|  |  +--------+---------+  +---------+---------+  +-------+--------+  |  |
|  +-----------|----------------------|--------------------|-----------+  |
+--------------|----------------------|--------------------|--------------+
               |                      |                    |
               v                      v                    v
     +-------------------+  +-------------------+  +-------------------+
     | Local Filesystem  |  |  OS Hardware      |  | Remote WebDAV     |
     | (JSON Cache)      |  |  Keychain Store   |  | (Encrypted Sync)  |
     +-------------------+  +-------------------+  +-------------------+
```

---

## 🧩 Architectural Layers & Modules

### 1. Frontend Presentation Layer
- **Framework**: Next.js 16 (configured in Static HTML Export mode `output: 'export'`) + React 19.
- **State & Data Fetching**: TanStack React Query (SWR-style automatic background refetching and client-side caching).
- **Styling**: Vanilla CSS tokens & Tailwind CSS (Neo-Brutalist design tokens, responsive breakpoints, light/dark themes).
- **Accessibility**: Motion suppression via `MotionConfig reducedMotion="user"` and `@media (prefers-reduced-motion: reduce)`.

### 2. Native System Layer (Tauri v2 / Rust)
- **Container**: Tauri v2 shell (~15MB installer footprint, minimal RAM consumption).
- **File System Gateway**: Native Rust file I/O executing in the OS `app_data_dir` directory—immune to browser WebView cache cleaning daemons (e.g., macOS `cache_delete`).
- **OS Secrets Gateway**: Encapsulates the Rust `keyring 4.x` crate (using pure-Rust `zbus` D-Bus bindings on Linux) to read/write credentials to native hardware keychains.

---

## 📡 Tauri IPC Commands API Reference

The Rust backend exposes 5 core IPC commands to the frontend via `invoke()`:

| Command Name | Arguments | Return Type | Description |
| ------------ | --------- | ----------- | ----------- |
| `save_traffic_data` | `repoKey: string, dataType: string, data: string` | `Result<(), String>` | Writes repository traffic JSON to native filesystem (`app_data_dir/traffic_{dataType}_{repoKey}.json`). |
| `load_traffic_data` | `repoKey: string, dataType: string` | `Result<String, String>` | Reads repository traffic JSON from filesystem. |
| `bundle_traffic_cache` | *None* | `Result<String, String>` | Scans `app_data_dir`, aggregates all `traffic_*.json` files into a single bundle for sync upload. |
| `set_secret` | `key: string, value: string` | `Result<(), String>` | Writes a credential to the OS Native Keychain (`com.reporter.app`). |
| `get_secret` | `key: string` | `Result<Option<String>, String>` | Fetches a credential from the OS Native Keychain. |
| `delete_secret` | `key: string` | `Result<(), String>` | Removes a credential from the OS Native Keychain. |

---

## 🔒 Security & Cryptography Pipeline

### 1. OS Native Keychain Migration Flow (`src/lib/secrets.ts`)
To transition legacy plaintext credentials out of `localStorage` without risking token loss, Repo-rter uses a **Verified Transaction Migration** strategy:

```
[ App Launch ]
      |
      v
[ Check localStorage for Secret ] -- (Not Found) --> [ Done ]
      |
   (Found)
      v
[ Invoke Rust: set_secret(key, val) ] --> Writes to OS Keychain
      |
      v
[ Invoke Rust: get_secret(key) ] -------> Reads back secret
      |
      +---> (Verified Match === Plaintext?)
                   |
            +------+------+
            |             |
         (YES)           (NO)
            |             |
            v             v
   [ Purge Plaintext ]  [ Retain Plaintext ]
   [ from localStorage ] [ Log Migration Err ]
```

### 2. End-to-End Encryption (E2EE) Sync Pipeline (`src/lib/crypto.ts`)
Before uploading local traffic logs to a WebDAV remote server, payload encryption occurs client-side using the Web Crypto API:

1. **Key Derivation**: Passphrase + 16-byte random salt -> **PBKDF2** (100,000 iterations, SHA-256) -> 256-bit AES Key.
2. **Authenticated Encryption**: Plaintext JSON + 12-byte random IV -> **AES-256-GCM** -> Ciphertext.
3. **Payload Formatting**: Salt (16B) + IV (12B) + Ciphertext packed into portable Base64 string for WebDAV upload.

---

## ⚡ Rotational Background Sync Engine (`src/hooks/useBackgroundSync.ts`)

To avoid triggering GitHub PAT rate limits (5,000 requests/hour) for users with 50+ repositories:

- Repositories are sorted deterministically by stargazers count (`b.stargazers_count - a.stargazers_count`).
- A sliding window queue syncs repositories in batches of **10 per cycle**.
- The offset pointer (`background_sync_last_index`) is persisted between cycles.
- Every repository is guaranteed to be updated before its 14-day GitHub window expires.

---

## 📁 Repository Directory Structure

```
Repo-rter/
├── src/                        # Frontend Application (Next.js / React)
│   ├── app/                    # Next.js App Router (page.tsx, globals.css)
│   ├── components/             # React UI Components (Dashboard, SettingsModal)
│   ├── hooks/                  # Custom React Hooks (useBackgroundSync)
│   └── lib/                    # Core Frontend Modules
│       ├── auth.ts             # Async Auth Gateway
│       ├── crypto.ts           # Web Crypto AES-256-GCM E2EE Engine
│       ├── github.ts           # GitHub REST API v3 Client
│       ├── locales/            # Modular i18n Translation Modules
│       ├── secrets.ts          # OS Keyring + Fallback Gateway
│       ├── storage.ts          # Traffic Merge & Persistence Router
│       └── sync.ts             # WebDAV Remote Sync Handler
│
├── src-tauri/                  # Native Rust Application Container
│   ├── Cargo.toml              # Rust Dependencies (tauri, keyring, serde)
│   ├── tauri.conf.json         # Tauri Configs (Identifier, Window, Permissions)
│   └── src/
│       ├── lib.rs              # Main Tauri Command Handler & Bundle Engine
│       └── secrets.rs          # Native OS Keychain Integration
│
├── docs/                       # GitHub Pages Landing Page Site
├── ABOUT.md                    # Detailed Project Background & Vision
├── ARCHITECTURE.md             # Technical Architecture (This File)
├── CHANGELOG.md                # Version History Log
├── CONTRIBUTING.md             # Developer Contribution Guide
└── SECURITY.md                 # Security Disclosure & Policy
```
