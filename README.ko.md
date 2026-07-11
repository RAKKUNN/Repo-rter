# 📊 Repo-rter

[🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇨🇳 中文](README.zh.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇸🇦 العربية](README.ar.md) | [🇷🇺 Русский](README.ru.md) | [🇵🇹 Português](README.pt.md) | [🇮🇩 Bahasa Indonesia](README.id.md) | [🇩🇪 Deutsch](README.de.md) | [🇯🇵 日本語](README.ja.md)

---

Tauri와 Next.js로 구축된 아름답고 직관적인 네오 브루탈리즘 / 픽셀 아트 스타일의 깃허브 트래픽 분석 툴입니다.

<div align="center">
  <img src="./public/logo.png" width="100" />
</div>

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

## 💻 로컬 개발 시작하기

로컬 환경에서 앱을 실행하는 방법입니다:

```bash
npm install
npm run tauri dev
```

## ❤️ 후원하기
이 프로젝트가 유용하셨다면 [GitHub Sponsors](https://github.com/sponsors/RAKKUNN)를 통한 후원이나 레포지토리 Star⭐를 부탁드립니다!
