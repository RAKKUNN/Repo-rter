# 📊 Repo-rter

[🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇨🇳 中文](README.zh.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇸🇦 العربية](README.ar.md) | [🇷🇺 Русский](README.ru.md) | [🇵🇹 Português](README.pt.md) | [🇮🇩 Bahasa Indonesia](README.id.md) | [🇩🇪 Deutsch](README.de.md) | [🇯🇵 日本語](README.ja.md)

---

<div align="center">
  <img src="./public/logo.png" width="120" style="margin-bottom: 20px;" />

  <h3>Tauri와 Next.js로 구축된 아름답고 직관적인 네오 브루탈리즘 / 픽셀 아트 스타일의 깃허브 트래픽 분석 툴입니다.</h3>

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

## 📖 Repo-rter 소개
깃허브는 기본적으로 단 14일 동안의 트래픽 데이터만 제공합니다. Repo-rter는 백그라운드에서 주기적으로 트래픽을 수집하여 로컬에 무제한으로 저장합니다. 이제 소중한 방문자 및 클론 데이터를 잃어버리지 마세요!

## 🚀 주요 기능
- 📈 깃허브 트래픽 무제한 기록 (14일 제한 우회)
- 🎨 네오 브루탈리즘 / 픽셀 아트 UI
- 🔄 시스템 트레이 및 크론(Cron)을 통한 백그라운드 데이터 수집
- 💾 CSV 및 JSON 데이터 내보내기
- 🌐 12개 국어 지원

## 🛠️ 기술 스택
- **프론트엔드**: Next.js, React, TailwindCSS
- **백엔드**: Tauri (Rust)
- **상태 관리**: React Query 로컬 캐싱
- **배포**: GitHub Actions 기반 자동 빌드

## ⬇️ 설치 방법 (일반 사용자용)
직접 빌드할 필요 없이 설치 파일을 다운로드하여 바로 사용할 수 있습니다:
1. [Releases 페이지](https://github.com/RAKKUNN/Repo-rter/releases/latest)로 이동합니다.
2. 사용 중인 운영체제에 맞는 설치 파일을 다운로드합니다:
   - **macOS**: `Repo-rter_x.x.x_aarch64.dmg` 또는 `x64.dmg`
   - **Windows**: `Repo-rter_x.x.x_x64-setup.exe`
   - **Linux**: `repo-rter_x.x.x_amd64.deb`
3. 다운로드한 파일을 실행하여 앱을 설치하고 사용합니다.

## 💻 로컬 개발 환경 (개발자용)

### 사전 준비
개발 환경을 구축하기 위해 다음 소프트웨어들이 필요합니다:
- [Node.js](https://nodejs.org/) (v18 이상)
- [Rust](https://www.rust-lang.org/tools/install) (최신 안정화 버전)
- 운영체제별 빌드 도구 (macOS: Xcode, Windows: C++ Build Tools, Linux: `libwebkit2gtk-4.0-dev`).

### 빌드 및 실행
1. **레포지토리 클론:**
```bash
git clone https://github.com/RAKKUNN/Repo-rter.git
cd Repo-rter
```
2. **의존성 패키지 설치:**
```bash
npm install
```
3. **개발 서버 실행:**
Next.js 프론트엔드와 Tauri 백엔드가 함께 실행됩니다.
```bash
npm run tauri dev
```
4. **프로덕션 빌드:**
```bash
npm run tauri build
```

## ❤️ 후원하기
이 프로젝트가 유용하셨다면 [GitHub Sponsors](https://github.com/sponsors/RAKKUNN)를 통한 후원이나 레포지토리 Star⭐를 부탁드립니다!
