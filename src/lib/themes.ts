'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeCategory = 'mainstream' | 'popular' | 'special' | 'retro';

export interface UIThemeDefinition {
  id: string;
  nameKo: string;
  nameEn: string;
  category: ThemeCategory;
  badge: string;
  description: string;
  reference: string;
  isDark: boolean;
  preview: {
    bg: string;
    panel: string;
    primary: string;
    secondary: string;
    border: string;
    radius: string;
    shadow: string;
  };
}

export const UI_THEMES: UIThemeDefinition[] = [
  // ==========================================
  // 1. 2026 메인스트림 UI 디자인 스타일 (Mainstream)
  // ==========================================
  {
    id: 'flat-notion',
    nameKo: '플랫 디자인 (라이트)',
    nameEn: 'Flat Design — Notion Paper',
    category: 'mainstream',
    badge: 'Flat 2D',
    description: '그림자와 입체감을 배제한 깔끔한 2D 단색 표면과 얇은 구분선',
    reference: 'Notion, Slack',
    isDark: false,
    preview: {
      bg: '#F7F6F3',
      panel: '#FFFFFF',
      primary: '#2383E2',
      secondary: '#9065B0',
      border: '#E3E2E0',
      radius: '6px',
      shadow: 'none',
    },
  },
  {
    id: 'flat-spotify',
    nameKo: '플랫 디자인 (다크)',
    nameEn: 'Flat Design — Spotify Carbon',
    category: 'mainstream',
    badge: 'Flat Dark',
    description: '매트한 다크 그레이 표면과 고채도 그린 포인트를 활용한 모던 2D 플랫',
    reference: 'Spotify, Discord',
    isDark: true,
    preview: {
      bg: '#121212',
      panel: '#181818',
      primary: '#1DB954',
      secondary: '#1ED760',
      border: '#282828',
      radius: '8px',
      shadow: 'none',
    },
  },
  {
    id: 'material-you',
    nameKo: '머티리얼 디자인 3',
    nameEn: 'Material Design 3 (Material You)',
    category: 'mainstream',
    badge: 'Elevation',
    description: '종이가 겹쳐진 듯한 다층 엘리베이션 그림자와 부드러운 파스텔 토널 팔레트',
    reference: 'Google Drive, YouTube, Android 15',
    isDark: false,
    preview: {
      bg: '#FEF7FF',
      panel: '#F3EDF7',
      primary: '#6750A4',
      secondary: '#7D5260',
      border: '#CAC4D0',
      radius: '20px',
      shadow: '0 4px 12px rgba(103,80,164,0.12)',
    },
  },
  {
    id: 'fluent-acrylic',
    nameKo: '플루언트 디자인',
    nameEn: 'Fluent Design — Windows 11 Acrylic',
    category: 'mainstream',
    badge: 'Acrylic Blur',
    description: '반투명 아크릴 블러 배경과 빛나는 Reveal 테두리 하이라이트',
    reference: 'Windows 11, Microsoft 365',
    isDark: true,
    preview: {
      bg: '#0F172A',
      panel: 'rgba(30, 41, 59, 0.72)',
      primary: '#60CDFF',
      secondary: '#A855F7',
      border: 'rgba(255, 255, 255, 0.16)',
      radius: '10px',
      shadow: '0 8px 32px rgba(0,0,0,0.35)',
    },
  },
  {
    id: 'apple-hig',
    nameKo: '애플 휴먼 인터페이스',
    nameEn: 'Apple HIG — macOS Vibrancy',
    category: 'mainstream',
    badge: 'Vibrancy',
    description: '고채도 Vibrancy 반투명 유리 질감과 연속 곡률(Squircle), 정교한 헤어라인 보더',
    reference: 'macOS Sequoia, iOS Control Center',
    isDark: false,
    preview: {
      bg: '#ECEFF4',
      panel: 'rgba(255, 255, 255, 0.78)',
      primary: '#007AFF',
      secondary: '#5856D6',
      border: 'rgba(0, 0, 0, 0.08)',
      radius: '14px',
      shadow: '0 10px 30px rgba(0,0,0,0.06)',
    },
  },
  {
    id: 'glassmorphism',
    nameKo: '글래스모피즘',
    nameEn: 'Glassmorphism — Frosted Crystal',
    category: 'mainstream',
    badge: 'Frosted Glass',
    description: '컬러풀한 배경 위로 흐릿하게 비치는 뿌연 유리 레이어와 광택 테두리',
    reference: 'macOS Big Sur, VisionOS',
    isDark: true,
    preview: {
      bg: '#1E1B4B',
      panel: 'rgba(255, 255, 255, 0.12)',
      primary: '#38BDF8',
      secondary: '#F472B6',
      border: 'rgba(255, 255, 255, 0.28)',
      radius: '18px',
      shadow: '0 8px 32px rgba(15, 23, 42, 0.45)',
    },
  },

  // ==========================================
  // 2. 자주 사용되는 UI 디자인 스타일 (Popular)
  // ==========================================
  {
    id: 'neumorphism-light',
    nameKo: '뉴모피즘 (라이트)',
    nameEn: 'Neumorphism — Soft Extruded',
    category: 'popular',
    badge: 'Soft 3D',
    description: '배경과 동일한 색감에 양방향 빛/그림자를 주어 볼록하게 솟아오른 촉각 UI',
    reference: 'Dribbble Neumorphic Concept',
    isDark: false,
    preview: {
      bg: '#E0E5EC',
      panel: '#E0E5EC',
      primary: '#4F46E5',
      secondary: '#0EA5E9',
      border: 'transparent',
      radius: '20px',
      shadow: '6px 6px 12px #A3B1C6, -6px -6px 12px #FFFFFF',
    },
  },
  {
    id: 'neumorphism-dark',
    nameKo: '뉴모피즘 (다크)',
    nameEn: 'Neumorphism — Dark Tactile',
    category: 'popular',
    badge: 'Tactile Dark',
    description: '다크 슬레이트 표면에서 은은한 음각·양각 그림자로 입체감을 살린 다크 뉴모피즘',
    reference: 'Dark Audio Console UI',
    isDark: true,
    preview: {
      bg: '#24272C',
      panel: '#24272C',
      primary: '#38BDF8',
      secondary: '#818CF8',
      border: 'transparent',
      radius: '20px',
      shadow: '6px 6px 12px #181A1D, -6px -6px 12px #30343B',
    },
  },
  {
    id: 'minimal-muji',
    nameKo: '미니멀리즘',
    nameEn: 'Minimalism — MUJI / Swiss Pure',
    category: 'popular',
    badge: 'Ultra Clean',
    description: '극단적인 여백과 절제된 무채색, 장식을 덜어낸 본질 중심의 미니멀 디자인',
    reference: 'Apple.com, MUJI, Minimal Gallery',
    isDark: false,
    preview: {
      bg: '#FAFAFA',
      panel: '#FFFFFF',
      primary: '#111111',
      secondary: '#666666',
      border: '#EAEAEA',
      radius: '0px',
      shadow: 'none',
    },
  },
  {
    id: 'oled-midnight',
    nameKo: '다크 모드 (OLED 블랙)',
    nameEn: 'OLED True Black Mode',
    category: 'popular',
    badge: 'True #000',
    description: '완전한 순수 블랙(#000000) 배경과 눈의 피로를 줄이는 시안·바이올렛 다크 테마',
    reference: 'Linear Dark, X OLED Mode',
    isDark: true,
    preview: {
      bg: '#000000',
      panel: '#0A0A0C',
      primary: '#22D3EE',
      secondary: '#A855F7',
      border: '#1F242D',
      radius: '10px',
      shadow: 'none',
    },
  },
  {
    id: 'card-bento',
    nameKo: '카드 기반 벤토 디자인',
    nameEn: 'Card-based — Bento Grid',
    category: 'popular',
    badge: 'Bento Card',
    description: '넉넉한 곡률의 독립 카드 모듈과 부드러운 플로팅 섀도우 중심의 레이아웃',
    reference: 'Pinterest, Trello, Apple Bento',
    isDark: false,
    preview: {
      bg: '#F1F5F9',
      panel: '#FFFFFF',
      primary: '#EA580C',
      secondary: '#2563EB',
      border: '#E2E8F0',
      radius: '24px',
      shadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
    },
  },
  {
    id: 'gradient-stripe',
    nameKo: '그라데이션 디자인',
    nameEn: 'Gradient Design — Stripe Vivid',
    category: 'popular',
    badge: 'Gradient',
    description: '두 가지 이상의 고채도 컬러가 부드럽게 블렌딩되는 비비드 그라데이션 스타일',
    reference: 'Stripe, Instagram, Figma',
    isDark: true,
    preview: {
      bg: '#0B0F19',
      panel: '#131B2E',
      primary: '#6366F1',
      secondary: '#EC4899',
      border: '#312E81',
      radius: '16px',
      shadow: '0 10px 30px rgba(99, 102, 241, 0.2)',
    },
  },

  // ==========================================
  // 3. 특수 목적 UI 디자인 스타일 (Special Purpose)
  // ==========================================
  {
    id: 'neubrutalism-light',
    nameKo: '네오브루탈리즘 (라이트)',
    nameEn: 'Neubrutalism — Gumroad Pop',
    category: 'special',
    badge: 'Signature',
    description: '두꺼운 검정 테두리와 블러 없이 딱 떨어지는 하드 오프셋 그림자 (Repo-rter 기본)',
    reference: 'Gumroad, Figma Community',
    isDark: false,
    preview: {
      bg: '#E5E5F7',
      panel: '#FFFFFF',
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      border: '#1A1A1A',
      radius: '0px',
      shadow: '6px 6px 0px #1A1A1A',
    },
  },
  {
    id: 'neubrutalism-dark',
    nameKo: '네오브루탈리즘 (다크)',
    nameEn: 'Neubrutalism — Arcade Dark',
    category: 'special',
    badge: 'Hard Shadow',
    description: '다크 캔버스 위에 선명한 화이트 테두리와 하드 오프셋 그림자를 결합한 아케이드 감성',
    reference: 'Repo-rter Dark Edition',
    isDark: true,
    preview: {
      bg: '#16161A',
      panel: '#1F1F24',
      primary: '#60A5FA',
      secondary: '#A78BFA',
      border: '#F5F5F5',
      radius: '0px',
      shadow: '6px 6px 0px #F5F5F5',
    },
  },
  {
    id: 'typographic-editorial',
    nameKo: '타이포그래픽 에디토리얼',
    nameEn: 'Typographic — Bloomberg Editorial',
    category: 'special',
    badge: 'Editorial',
    description: '종이 신문과 패션 매거진처럼 강렬한 세리프 헤드라인과 굵은 지면 구분선 중심',
    reference: 'Bloomberg, NYT, Typewolf',
    isDark: false,
    preview: {
      bg: '#FBF9F5',
      panel: '#F4F0E8',
      primary: '#111111',
      secondary: '#B91C1C',
      border: '#111111',
      radius: '0px',
      shadow: 'none',
    },
  },
  {
    id: 'brutalism-raw',
    nameKo: '오리지널 브루탈리즘',
    nameEn: 'Brutalism — 90s Raw HTML',
    category: 'special',
    badge: 'Raw 90s',
    description: '90년대 초창기 웹의 거칠고 투박한 고대비 원색과 모노스페이스 시스템 폰트',
    reference: 'Craigslist, Brutalist Websites',
    isDark: false,
    preview: {
      bg: '#FFFF00',
      panel: '#FFFFFF',
      primary: '#0000FF',
      secondary: '#FF0000',
      border: '#000000',
      radius: '0px',
      shadow: '4px 4px 0px #0000FF',
    },
  },
  {
    id: 'three-d-depth',
    nameKo: '3D 입체 뎁스 디자인',
    nameEn: '3D Design — Layered Perspective',
    category: 'special',
    badge: '3D Depth',
    description: '다중 입체 베벨(Bevel)과 깊은 바닥 그림자, 호버 시 3차원 리프트감을 주는 스타일',
    reference: 'Spline 3D Showcase, Gaming HUD',
    isDark: true,
    preview: {
      bg: '#0D1117',
      panel: '#161B22',
      primary: '#38BDF8',
      secondary: '#F59E0B',
      border: '#30363D',
      radius: '14px',
      shadow: '0 8px 0 #010409, 0 18px 28px rgba(0,0,0,0.6)',
    },
  },
  {
    id: 'isometric-blueprint',
    nameKo: '아이소메트릭 블루프린트',
    nameEn: 'Isometric — 2.5D Blueprint',
    category: 'special',
    badge: '2.5D Grid',
    description: '아이소메트릭 도면 그리드 패턴과 45도 대각선 입체 압출 그림자가 결합된 2.5D 스타일',
    reference: 'Technical CAD Blueprint, Isometric Rig',
    isDark: true,
    preview: {
      bg: '#0A2540',
      panel: '#0F345B',
      primary: '#00D4FF',
      secondary: '#38BDF8',
      border: '#00D4FF',
      radius: '2px',
      shadow: '6px 6px 0px rgba(0, 212, 255, 0.35)',
    },
  },
  {
    id: 'claymorphism',
    nameKo: '클레이모피즘',
    nameEn: 'Claymorphism — 3D Soft Clay',
    category: 'special',
    badge: 'Soft Clay',
    description: '점토나 말랑한 플라스틱 장난감처럼 둥글고 통통한 내부 이너 섀도우 입체 질감',
    reference: 'HYPE4 Claymorphism, 3D Toy UI',
    isDark: false,
    preview: {
      bg: '#EEF2FF',
      panel: '#FFFFFF',
      primary: '#6366F1',
      secondary: '#EC4899',
      border: 'rgba(255,255,255,0.7)',
      radius: '28px',
      shadow: '0 12px 24px rgba(99, 102, 241, 0.18), inset -4px -4px 8px rgba(99, 102, 241, 0.12)',
    },
  },
  {
    id: 'aurora-mesh',
    nameKo: '오로라 / 메쉬 그라데이션',
    nameEn: 'Aurora UI — Mesh Gradient',
    category: 'special',
    badge: 'Aurora Mesh',
    description: '어두운 밤하늘 배경 위로 여러 색의 오로라 광원이 물감처럼 번지는 몽환적 테크 UI',
    reference: 'Stripe Mesh, Linear, Web3 Dashboards',
    isDark: true,
    preview: {
      bg: '#070913',
      panel: 'rgba(17, 24, 39, 0.68)',
      primary: '#34D399',
      secondary: '#818CF8',
      border: 'rgba(129, 140, 248, 0.28)',
      radius: '16px',
      shadow: '0 12px 36px rgba(16, 185, 129, 0.15)',
    },
  },

  // ==========================================
  // 4. 레트로 UI 디자인 스타일 (Retro & Heritage)
  // ==========================================
  {
    id: 'frutiger-aero',
    nameKo: '프루티거 에어로',
    nameEn: 'Frutiger Aero — 2000s Aqua Gloss',
    category: 'retro',
    badge: '2000s Gloss',
    description: 'Windows Vista/7 시절의 투명한 아쿠아 광택 젤 버튼과 청량한 스카이 블루·민트 감성',
    reference: 'Windows Vista / 7, Wii, Aqua UI',
    isDark: false,
    preview: {
      bg: '#D8F3FA',
      panel: 'rgba(255, 255, 255, 0.82)',
      primary: '#0284C7',
      secondary: '#10B981',
      border: '#7DD3FC',
      radius: '14px',
      shadow: '0 6px 20px rgba(2, 132, 199, 0.18), inset 0 2px 0 rgba(255,255,255,0.9)',
    },
  },
  {
    id: 'skeuomorphism',
    nameKo: '스큐어모피즘',
    nameEn: 'Skeuomorphism — Tactile Studio',
    category: 'retro',
    badge: 'Real Texture',
    description: '가죽 다이어리 스티치, 따뜻한 크림 종이 질감과 금속 베젤 스위치의 아날로그 감성',
    reference: 'Pre-iOS 7 Classic Apps, Analog Synth',
    isDark: false,
    preview: {
      bg: '#D6CFC2',
      panel: '#F5EFE0',
      primary: '#9A3412',
      secondary: '#B45309',
      border: '#8C7A6B',
      radius: '10px',
      shadow: '0 4px 8px rgba(0,0,0,0.28), inset 0 1px 0 #FFFFFF',
    },
  },
];

export const THEME_CATEGORIES: { id: ThemeCategory | 'all'; labelKo: string; labelEn: string }[] = [
  { id: 'all', labelKo: '전체 (22)', labelEn: 'All (22)' },
  { id: 'mainstream', labelKo: '2026 메인스트림', labelEn: '2026 Mainstream' },
  { id: 'popular', labelKo: '인기 범용 스타일', labelEn: 'Popular Styles' },
  { id: 'special', labelKo: '특수 목적 스타일', labelEn: 'Special Purpose' },
  { id: 'retro', labelKo: '레트로 / 헤리티지', labelEn: 'Retro & Heritage' },
];

interface UIThemeContextValue {
  uiTheme: string;
  setUITheme: (themeId: string) => void;
  currentThemeDef: UIThemeDefinition;
}

const UIThemeContext = createContext<UIThemeContextValue>({
  uiTheme: 'neubrutalism-light',
  setUITheme: () => {},
  currentThemeDef: UI_THEMES[12], // neubrutalism-light
});

export const STORAGE_KEY_UI_THEME = 'reporter_ui_design_theme';

export function UIThemeProvider({ children }: { children: React.ReactNode }) {
  const [uiTheme, setUIThemeState] = useState<string>('neubrutalism-light');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_UI_THEME);
    if (saved && UI_THEMES.some((t) => t.id === saved)) {
      setUIThemeState(saved);
      applyThemeToDocument(saved);
    } else {
      // Check legacy next-themes preference if present
      const legacyTheme = localStorage.getItem('theme');
      const initial = legacyTheme === 'dark' ? 'neubrutalism-dark' : 'neubrutalism-light';
      setUIThemeState(initial);
      applyThemeToDocument(initial);
    }
  }, []);

  const setUITheme = (themeId: string) => {
    const found = UI_THEMES.find((t) => t.id === themeId);
    if (!found) return;
    setUIThemeState(themeId);
    localStorage.setItem(STORAGE_KEY_UI_THEME, themeId);
    localStorage.setItem('theme', found.isDark ? 'dark' : 'light');
    applyThemeToDocument(themeId);
  };

  const currentThemeDef =
    UI_THEMES.find((t) => t.id === uiTheme) || UI_THEMES[12];

  return React.createElement(
    UIThemeContext.Provider,
    { value: { uiTheme, setUITheme, currentThemeDef } },
    children
  );
}

export function useUITheme() {
  return useContext(UIThemeContext);
}

export function applyThemeToDocument(themeId: string) {
  if (typeof document === 'undefined') return;
  const def = UI_THEMES.find((t) => t.id === themeId) || UI_THEMES[12];
  const root = document.documentElement;
  root.setAttribute('data-ui-theme', def.id);
  if (def.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
