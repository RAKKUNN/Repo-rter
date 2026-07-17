# 📊 Repo-rter

[🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇨🇳 中文](README.zh.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇸🇦 العربية](README.ar.md) | [🇷🇺 Русский](README.ru.md) | [🇵🇹 Português](README.pt.md) | [🇮🇩 Bahasa Indonesia](README.id.md) | [🇩🇪 Deutsch](README.de.md) | [🇯🇵 日本語](README.ja.md)

---

<div align="center">
  <img src="./public/logo.png" width="120" style="margin-bottom: 20px;" />

  <h3>깃허브 레포지토리의 트래픽 추이와 릴리스 다운로드 통계를 영구 보존하는 로컬 퍼스트 데스크톱 대시보드</h3>

  [![Product Hunt](https://img.shields.io/badge/Product_Hunt-Featured-orange?logo=product-hunt&style=for-the-badge)](https://www.producthunt.com/products/reporter-2)
  [![GitHub release](https://img.shields.io/github/v/release/RAKKUNN/Repo-rter?style=for-the-badge&color=green)](https://github.com/RAKKUNN/Repo-rter/releases)
  [![GitHub stars](https://img.shields.io/github/stars/RAKKUNN/Repo-rter?style=for-the-badge&color=yellow)](https://github.com/RAKKUNN/Repo-rter/stargazers)
  [![GitHub license](https://img.shields.io/github/license/RAKKUNN/Repo-rter?style=for-the-badge&color=blue)](https://github.com/RAKKUNN/Repo-rter/blob/main/LICENSE)
  [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge)](https://github.com/RAKKUNN/Repo-rter/releases)
</div>

<br />

## 📸 스크린샷

| 대시보드 개요 | 글로벌 트래픽 타임라인 |
| :---: | :---: |
| <img src="./public/screenshots/overview.png" width="400"/> | <img src="./public/screenshots/global_traffic.png" width="400"/> |
| **개별 레포지토리 상세** | **릴리스 통계 및 세부 분석** |
| <img src="./public/screenshots/repo_traffic.png" width="400"/> | <img src="./public/screenshots/details.png" width="400"/> |

---

## 💡 개발 동기

오픈소스 프로젝트를 관리하다 보면 내 레포지토리에 사람들이 얼마나 들어오는지 분석 탭(Insights)을 자주 들여다보게 됩니다. 하지만 두 가지 치명적인 불편함이 있었습니다:

1. **14일의 제한 한계**: 깃허브는 기본 트래픽 분석(방문자 수, 클론 수, 유입 경로 등) 데이터를 **정확히 14일 동안만 보존**합니다. 이 기간이 지나면 이전 데이터는 영구적으로 유실됩니다.
2. **다중 레포지토리 관리의 피로감**: 관리하는 레포지토리가 여러 개라면, 매번 깃허브 웹사이트에 들어가 각 레포지토리의 "Insights" -> "Traffic" 메뉴를 하나씩 클릭해서 확인해야 합니다.

간단한 트래픽 기록 보관을 위해 매달 비용을 지불하고 외부 SaaS 분석 도구를 쓰기는 아까웠고, 개인 서버에 스크래퍼 크론잡을 구축하기도 번거로웠습니다. 그래서 로컬에서 가볍게 동작하며 이 문제를 한 번에 해결해 주는 **Repo-rter**를 직접 개발하게 되었습니다.

---

## ⚙️ 작동 원리

Repo-rter는 로컬 환경에 상주하며 깃허브 API와 유저 사이에서 스마트한 캐싱 레이어 역할을 합니다:

* **로컬 머지(Merging)**: 새로 가져온 트래픽 데이터를 기존에 저장된 데이터와 날짜별 고유 키를 기준으로 로컬 데이터베이스(SQLite 및 로컬 스토리지) 내에서 머지합니다. 중복 데이터 없이 온전한 영구 타임라인을 스스로 구축해 나갑니다.
* **백그라운드 스케줄러**: Tauri 백그라운드 프로세스가 크론(Cron) 형태로 주기적인 동기화를 자동 수행하므로, 앱 화면을 매번 켜두지 않아도 백그라운드에서 트래픽이 알아서 쌓입니다.
* **로컬 보안 우선**: 깃허브 개인 액세스 토큰(PAT)은 외부 서버를 타지 않고 전적으로 사용자 컴퓨터 내에만 안전하게 암호화되어 저장됩니다.

---

## ✨ 주요 기능

- **트래픽 영구 캐싱**: 뷰(Views), 클론(Clones), 유입 경로(Referrers) 데이터를 14일 제한 없이 보존
- **릴리스 다운로드 트래커**: 배포된 모든 버전의 각 에셋(.exe, .dmg, .deb 등)별 실시간 다운로드 수 집계 및 통계
- **통합 글로벌 대시보드**: 등록된 모든 레포지토리의 누적 스타(Stars), 포크(Forks), 트래픽 동향을 요약 차트로 제공
- **마크다운 리포트 추출**: 단 한 번의 클릭으로 레포지토리 통계 보고서를 깔끔한 마크다운 양식으로 다운로드
- **Tauri 기반의 경량화**: 일렉트론(Electron)과 비교할 수 없이 가벼운 용량(~15MB 내외) 및 최소한의 메모리 점유율
- **네오 브루탈리즘 UI**: 조작하는 재미를 더해주는 개성 있고 생동감 넘치는 반응형 디자인 인터페이스

---

## ⬇️ 설치 및 사용 방법

### 1. 프로그램 다운로드
[Releases 페이지](https://github.com/RAKKUNN/Repo-rter/releases/latest)에서 본인의 OS에 맞는 설치 파일을 다운로드하세요:
* **macOS**: `Repo-rter_x.x.x_aarch64.dmg` (M1/M2/M3 등 애플 실리콘) 또는 `x64.dmg` (인텔)
* **Windows**: `Repo-rter_x.x.x_x64-setup.exe`
* **Linux**: `repo-rter_x.x.x_amd64.deb`

### 2. 깃허브 액세스 토큰(PAT) 설정
트래픽 데이터를 불러오기 위해 깃허브 토큰이 필요합니다:
1. GitHub 계정 -> **Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Fine-grained tokens**로 이동합니다.
2. **Generate new token**을 클릭합니다.
3. 다음 권한에 대해 **Read-only(읽기 전용)** 권한을 부여합니다:
   * **Metadata** (레포지토리 기본 정보)
   * **Administration** (트래픽 API 호출 권한을 얻기 위해 필수적으로 요구됨)
4. 생성된 토큰을 복사하여 Repo-rter의 설정 창에 붙여넣으면 즉시 사용이 가능합니다.

---

## 🙋 자주 묻는 질문 (FAQ)

#### Q. 토큰에 왜 "Administration" 권한이 필요한가요?
이것은 깃허브 API 자체의 제약 사항입니다. 깃허브는 레포지토리의 소유자나 관리 권한을 가진 유저에게만 트래픽 데이터 조회 API(`/traffic` 엔드포인트) 호출을 허용합니다. 따라서 부득이하게 Administration 읽기 권한이 필요합니다. Repo-rter는 100% 오픈소스 프로젝트이므로, 소스코드를 직접 검증하여 토큰이 외부로 유출되거나 오용되지 않음을 확인하실 수 있습니다.

#### Q. 제 데이터는 안전하게 저장되나요?
사용자의 개인 토큰 및 누적된 통계 데이터는 오직 사용자의 로컬 환경(OS 앱 데이터 경로)에만 저장됩니다. 어떠한 외부 웹 서버나 서드파티 DB로도 데이터를 수집하지 않습니다.

#### Q. API 호출 횟수 제한(Rate Limit)에 걸리진 않나요?
백그라운드 동기화 주기가 최적화되어 있어 제한에 잘 걸리지 않습니다. 등록된 레포지토리가 너무 많아 일시적으로 제한이 걸리더라도, 앱이 이를 감지하여 안전하게 대기한 뒤 한도가 초기화되면 자동으로 동기화를 재개합니다.

---

## 🗺️ 개발 로드맵

- [x] 릴리스 에셋별 누적 다운로드 추적 기능 추가
- [x] 마크다운 통계 리포트 다운로드 기능
- [ ] 디스코드 / 텔레그램 웹훅 알림 연동 (스타 달성, 릴리스 다운로드 이정표 알림 등)
- [ ] 오프라인 인터랙티브 차트 줌 인/아웃 및 기간별 필터 강화
- [ ] GitHub Actions를 활용한 헤드리스(Headless) 동기화 옵션 제공

---

## 💻 로컬 개발 환경 구성

### 사전 요구사항
- Node.js (v18 이상)
- Rust (최신 안정버전)
- OS별 빌드 의존성 소프트웨어 (macOS: Xcode, Windows: C++ 빌드 도구)

### 개발 서버 실행
```bash
git clone https://github.com/RAKKUNN/Repo-rter.git
cd Repo-rter
npm install
npm run tauri dev
```

### 배포용 빌드
```bash
npm run tauri build
```

---

## ❤️ 기여 및 후원

Repo-rter는 기여자분들의 참여를 환영합니다! 버그 제보, 기능 제안, 번역 수정 등은 언제든지 Issue 또는 Pull Request를 남겨주세요.

Repo-rter가 소중한 트래픽 기록을 지키는 데 도움이 되었다면 레포지토리 **Star⭐를 눌러** 응원해 주세요!

## 📝 변경 이력 (Changelog)

### v0.4.2
- WebDAV 클라우드 동기화 기능 탑재 (여러 기기 간 트래픽 로그 백업 및 복원 지원).
- Web Crypto API 기반 AES-256-GCM 종단간 암호화(E2EE)를 적용하여 보안 동기화 보장.
- 동기화 최적화를 위한 네이티브 Rust 번들링 및 머지 백엔드 커맨드 추가.

### v0.4.1
- 사용자 맞춤 데이터 보존 기간 설정 기능 탑재 (오래된 트래픽 통계 자동 삭제).
- 설정 창의 정보(About) 화면 내 버전 정보를 패키지 설정과 실시간 동기화되도록 수정.

### v0.4.0
- 트래픽 데이터를 `localStorage`에서 OS 물리 파일 저장소로 마이그레이션 (시스템 캐시 정리 시 데이터 유실 방지).
- 여러 기기 간 데이터 이전을 위한 JSON 백업 파일 가져오기(Import) 기능 추가.
- 슬라이딩 윈도우 기반 레포지토리 로테이션 백그라운드 동기화 구현 (API 제한 없이 모든 레포지토리 자동 동기화).
- 배포 패키징을 위한 리드미 및 프로젝트 구조 개선.

### v0.3.0
- 빌드된 배포 파일(Assets)별 다운로드 통적 추적 기능 탑재.
- 대시보드 통계 자료를 마크다운 보고서로 추출(Export)하는 기능 추가.

### v0.2.0
- 첫 오픈소스 릴리스.
- 기본적인 깃허브 트래픽 추적 기능 (Views, Clones, Paths, Referrers).
- 12개 국어 글로벌 다국어 지원.
- 네오 브루탈리즘 UI 디자인 및 백그라운드 자동 동기화.

---

## 📄 라이선스
이 프로젝트는 [MIT License](LICENSE)에 따라 자유롭게 사용 및 수정이 가능합니다.
