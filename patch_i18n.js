const fs = require('fs');

let content = fs.readFileSync('src/lib/i18n.ts', 'utf-8');

const enKeys = `
      "settings": "Settings",
      "general": "General",
      "appearance": "Appearance",
      "data": "Data",
      "account": "Account",
      "about": "About",
      "language": "Language",
      "displayLanguage": "Display Language",
      "changeLanguageDesc": "Change the application's interface language.",
      "dataPreferences": "Data Preferences",
      "includeForks": "Include Forked Repositories",
      "includeForksDesc": "If enabled, repos you forked will appear in your traffic analytics.",
      "theme": "Theme",
      "lightMode": "Light Mode",
      "darkMode": "Dark Mode",
      "exportData": "Export Data",
      "downloadLocalCache": "Download Local Cache",
      "exportDesc": "Export all your historically accumulated traffic data (views and clones) to analyze it in external tools like Excel or custom scripts.",
      "exportCsv": "Export as CSV",
      "exportJson": "Export as JSON",
      "githubProfile": "GitHub Profile",
      "dangerZone": "Danger Zone",
      "disconnectAccount": "Disconnect Account",
      "disconnectDesc": "This will remove your GitHub token from this device and return you to the login screen.",
`;

const koKeys = `
      "settings": "설정",
      "general": "일반",
      "appearance": "화면 설정",
      "data": "데이터",
      "account": "계정",
      "about": "정보",
      "language": "언어 설정",
      "displayLanguage": "표시 언어",
      "changeLanguageDesc": "앱 전체의 인터페이스 언어를 변경합니다.",
      "dataPreferences": "데이터 설정",
      "includeForks": "포크된 레포지토리 포함",
      "includeForksDesc": "활성화하면 내가 포크해온 레포지토리들도 트래픽 통계에 표시됩니다.",
      "theme": "테마",
      "lightMode": "라이트 모드",
      "darkMode": "다크 모드",
      "exportData": "데이터 내보내기",
      "downloadLocalCache": "로컬 캐시 다운로드",
      "exportDesc": "과거부터 앱에 누적 저장된 모든 트래픽 기록(조회수, 클론 수 등)을 외부 툴(엑셀 등)에서 분석할 수 있도록 추출합니다.",
      "exportCsv": "CSV로 내보내기",
      "exportJson": "JSON으로 내보내기",
      "githubProfile": "GitHub 프로필",
      "dangerZone": "위험 구역",
      "disconnectAccount": "계정 연결 해제",
      "disconnectDesc": "이 기기에서 GitHub 토큰을 완전히 삭제하고 로그인 화면으로 돌아갑니다.",
`;

content = content.replace(
  /"globalTraffic": "Global Traffic Overview"/,
  '"globalTraffic": "Global Traffic Overview",\n' + enKeys
);

content = content.replace(
  /"globalTraffic": "전체 트래픽 대시보드"/,
  '"globalTraffic": "전체 트래픽 대시보드",\n' + koKeys
);

fs.writeFileSync('src/lib/i18n.ts', content);
