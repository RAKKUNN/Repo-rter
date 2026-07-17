import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => false,
  invoke: vi.fn(),
}));

class LocalStorageMock {
  store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
  
  get length() {
    return Object.keys(this.store).length;
  }
  
  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
});

import { mergeTrafficData } from '@/lib/storage';

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
});
