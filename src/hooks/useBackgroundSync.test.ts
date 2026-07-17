import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => true,
  invoke: vi.fn(),
}));


vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: vi.fn(async () => true),
  requestPermission: vi.fn(async () => 'granted'),
  sendNotification: vi.fn(),
}));

vi.mock('@/lib/github', () => ({
  getRepos: vi.fn(async () => []),
  getRepoTrafficViews: vi.fn(async () => ({ count: 0, uniques: 0 })),
  getRepoTrafficClones: vi.fn(async () => ({ count: 0, uniques: 0 })),
}));

vi.mock('@/lib/storage', () => ({ cleanExpiredCache: vi.fn(async () => {}) }));
vi.mock('@/lib/sync', () => ({ uploadSync: vi.fn(async () => {}) }));

import { useBackgroundSync, SYNC_INTERVAL } from '@/hooks/useBackgroundSync';
import { setGithubToken } from '@/lib/auth';
import { getRepos } from '@/lib/github';

// 훅의 setupSync()는 알림 권한을 await한 뒤에야 setInterval을 건다.
// 타이머를 전진시키기 전에 그 프라미스 체인을 먼저 흘려보내야 한다.
async function runOneSyncCycle() {
  renderHook(() => useBackgroundSync());
  await act(async () => { await Promise.resolve(); });
  await act(async () => { await vi.advanceTimersByTimeAsync(SYNC_INTERVAL); });
}

describe('useBackgroundSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    vi.mocked(getRepos).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auth 모듈이 저장한 토큰으로 동기화를 시작한다', async () => {
    // 회귀 방지: 훅이 auth가 쓰지 않는 키('github_token')를 읽어
    // 초기 커밋부터 동기화가 조용히 조기 리턴하던 버그.
    setGithubToken('test_pat_value');

    await runOneSyncCycle();

    expect(getRepos).toHaveBeenCalled();
  });

  it('토큰이 없으면 GitHub API를 호출하지 않는다', async () => {
    await runOneSyncCycle();

    expect(getRepos).not.toHaveBeenCalled();
  });
});
