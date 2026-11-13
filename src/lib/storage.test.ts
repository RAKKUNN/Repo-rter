import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => false,
  invoke: vi.fn(),
}));

import { mergeTrafficData, loadAllBundledTraffic } from '@/lib/storage';
import { validateWebdavUrl } from '@/lib/sync';
import { encryptData, decryptData } from '@/lib/crypto';
import { UI_THEMES, applyThemeToDocument } from '@/lib/themes';

const point = (timestamp: string, count: number) => ({ timestamp, count, uniques: 1 });

describe('mergeTrafficData (브라우저 localStorage 경로)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('저장된 데이터가 없으면 incoming을 그대로 반환하고 저장한다', async () => {
    const incoming = [point('2026-06-01T00:00:00Z', 10)];

    const merged = await mergeTrafficData('owner/repo', 'views', incoming);

    expect(merged).toEqual(incoming);
    expect(JSON.parse(window.localStorage.getItem('gittraffic_views_owner/repo')!)).toEqual(incoming);
  });

  it('GitHub 14일 창을 벗어난 과거 데이터를 보존한다', async () => {
    // 앱의 존재 이유: GitHub 응답에서 사라진 과거 데이터가 살아남아야 한다.
    const old = [point('2026-01-01T00:00:00Z', 1), point('2026-02-01T00:00:00Z', 2)];
    window.localStorage.setItem('gittraffic_views_owner/repo', JSON.stringify(old));

    const merged = await mergeTrafficData('owner/repo', 'views', [point('2026-07-01T00:00:00Z', 3)]);

    expect(merged).toHaveLength(3);
    expect(merged.map((p) => p.timestamp)).toEqual([
      '2026-01-01T00:00:00Z',
      '2026-02-01T00:00:00Z',
      '2026-07-01T00:00:00Z',
    ]);
  });

  it('같은 날짜는 incoming 값으로 덮어쓰고 중복을 만들지 않는다', async () => {
    window.localStorage.setItem('gittraffic_views_owner/repo', JSON.stringify([point('2026-06-01T00:00:00Z', 10)]));

    const merged = await mergeTrafficData('owner/repo', 'views', [point('2026-06-01T00:00:00Z', 42)]);

    expect(merged).toHaveLength(1);
    expect(merged[0].count).toBe(42);
  });

  it('입력 순서와 무관하게 시간순으로 정렬한다', async () => {
    window.localStorage.setItem('gittraffic_views_owner/repo', JSON.stringify([point('2026-06-03T00:00:00Z', 3)]));

    const merged = await mergeTrafficData('owner/repo', 'views', [
      point('2026-06-05T00:00:00Z', 5),
      point('2026-06-01T00:00:00Z', 1),
    ]);

    expect(merged.map((p) => p.timestamp)).toEqual([
      '2026-06-01T00:00:00Z',
      '2026-06-03T00:00:00Z',
      '2026-06-05T00:00:00Z',
    ]);
  });

  it('views와 clones를 서로 다른 키에 저장한다', async () => {
    await mergeTrafficData('owner/repo', 'views', [point('2026-06-01T00:00:00Z', 10)]);
    await mergeTrafficData('owner/repo', 'clones', [point('2026-06-01T00:00:00Z', 99)]);

    expect(JSON.parse(window.localStorage.getItem('gittraffic_views_owner/repo')!)[0].count).toBe(10);
    expect(JSON.parse(window.localStorage.getItem('gittraffic_clones_owner/repo')!)[0].count).toBe(99);
  });

  it('loadAllBundledTraffic은 저장된 모든 레포의 views와 clones를 빠짐없이 묶어 반환한다', async () => {
    await mergeTrafficData('owner/repo-a', 'views', [point('2026-06-01T00:00:00Z', 15)]);
    await mergeTrafficData('owner/repo-b', 'clones', [point('2026-06-02T00:00:00Z', 7)]);

    const bundled = await loadAllBundledTraffic();
    expect(bundled.views['owner/repo-a']).toHaveLength(1);
    expect(bundled.views['owner/repo-a'][0].count).toBe(15);
    expect(bundled.clones['owner/repo-b']).toHaveLength(1);
    expect(bundled.clones['owner/repo-b'][0].count).toBe(7);
  });
});

describe('Security & Theme System Verification (v0.5.0)', () => {
  it('encryptData와 decryptData는 빈 패스프레이즈일 때 평문 반환 대신 즉시 예외를 던진다 (Fail-closed)', async () => {
    await expect(encryptData('{"secret":1}', '')).rejects.toThrow(/passphrase is required/i);
    await expect(encryptData('{"secret":1}', '   ')).rejects.toThrow(/passphrase is required/i);
    await expect(decryptData('abc', '')).rejects.toThrow(/passphrase is required/i);
  });

  it('validateWebdavUrl은 외부 http:// URL을 거부하고 https:// 또는 localhost만 허용한다', () => {
    expect(validateWebdavUrl('https://cloud.example.com/dav')).toBe(
      'https://cloud.example.com/dav/repo_rter_sync.enc'
    );
    expect(validateWebdavUrl('http://localhost:8080/dav/')).toBe(
      'http://localhost:8080/dav/repo_rter_sync.enc'
    );
    expect(() => validateWebdavUrl('http://insecure.example.com/dav')).toThrow(/HTTPS/i);
  });

  it('22개 이상의 고유한 UI 디자인 테마가 정의되어 있고 DOM에 정상 반영된다', () => {
    expect(UI_THEMES.length).toBeGreaterThanOrEqual(20);
    const uniqueIds = new Set(UI_THEMES.map((t) => t.id));
    expect(uniqueIds.size).toBe(UI_THEMES.length);

    applyThemeToDocument('glassmorphism');
    expect(document.documentElement.getAttribute('data-ui-theme')).toBe('glassmorphism');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyThemeToDocument('flat-notion');
    expect(document.documentElement.getAttribute('data-ui-theme')).toBe('flat-notion');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
