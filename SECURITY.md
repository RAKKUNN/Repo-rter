# Security Policy

## Supported Versions

We actively support and release security patches for the following versions of Repo-rter:

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| < 0.4.0 | :x:                |

We strongly encourage all users to upgrade to the latest stable release (v0.4.4+) to ensure sensitive credentials are stored in your OS native keychain rather than browser storage.

---

## Reporting a Vulnerability

The security of your credentials and repository analytics is our highest priority. Repo-rter is designed with a **privacy-first, local-first, and zero-knowledge architecture**.

If you discover a security vulnerability or potential credential leak mechanism in Repo-rter, please **DO NOT open a public GitHub Issue**.

Instead, please report vulnerabilities via one of the following methods:
1. **GitHub Private Vulnerability Reporting**: Use the "Report a vulnerability" button under the **Security** tab of this repository.
2. **Security Email**: Contact the maintainer directly at `security@repo-rter.app` (or contact `@RAKKUNN` via GitHub).

### What to Include in Your Report
- A description of the vulnerability and its potential impact.
- Step-by-step instructions or proof-of-concept (PoC) script to reproduce the issue.
- Affected OS platform(s) (macOS, Windows, Linux) and Repo-rter version.

### Our Response Process
- **Acknowledgment**: Within 48 hours.
- **Assessment & Fix**: We aim to verify and release a fix within 7 days for critical vulnerabilities.
- **Public Disclosure**: Once a fix is released, we will publish a Security Advisory with full credit to the reporter.

---

## Security Architecture Overview

Repo-rter incorporates several security layers by design:

### 1. Zero-Knowledge Credential Handling
- **No Centralized Servers**: Repo-rter does not run backend servers to track tokens or analytics. Your GitHub Personal Access Tokens (PAT) and sync credentials stay strictly on your local device.
- **Direct API Calls**: All GitHub API requests are made directly from your client machine to `api.github.com`.

### 2. OS Native Keychain Storage (v0.4.4+)
Sensitive secrets—including GitHub PATs, WebDAV passwords, and E2EE passphrases—are stored in native hardware/OS keychains via pure Rust bindings (`keyring` crate):
- **macOS**: Keychain Access
- **Windows**: Windows Credential Manager
- **Linux**: Secret Service API (via D-Bus)

Plaintext credentials in browser `localStorage` are automatically migrated and verified before deletion.

### 3. End-to-End Encryption (E2EE) Sync
Cloud synchronization over WebDAV uses Web Crypto API for client-side encryption before transmission:
- **Cipher**: AES-256-GCM (Authenticated Encryption).
- **Key Derivation**: PBKDF2 with 100,000 iterations and SHA-256 using a user-configured passphrase.
- **Salt & IV**: Cryptographically random 16-byte salt and 12-byte IV generated per backup payload.
- Cloud providers only store encrypted ciphertext bundles.
