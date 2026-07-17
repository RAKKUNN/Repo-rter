import { describe, it, expect, beforeEach, vi } from 'vitest';

const { keychain } = vi.hoisted(() => ({ keychain: new Map<string, string>() }));

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => true,
  invoke: vi.fn(async (cmd: string, args: { key: string; value?: string }) => {
    if (cmd === 'set_secret') { keychain.set(args.key, args.value!); return null; }
    if (cmd === 'get_secret') { return keychain.get(args.key) ?? null; }
    if (cmd === 'delete_secret') { keychain.delete(args.key); return null; }
    return null;
  }),
}));

import { setGithubToken, getGithubToken, removeGithubToken, hasGithubToken } from '@/lib/auth';

describe('auth', () => {
  beforeEach(() => {
    keychain.clear();
    window.localStorage.clear();
  });

  it('토큰을 키체인에 저장하고 평문으로 남기지 않는다', async () => {
    await setGithubToken('ghp_abc');

    expect(keychain.get('github_pat')).toBe('ghp_abc');
    expect(window.localStorage.getItem('github_pat')).toBeNull();
    expect(await getGithubToken()).toBe('ghp_abc');
  });

  it('토큰이 없으면 hasGithubToken이 false다', async () => {
    expect(await hasGithubToken()).toBe(false);

    await setGithubToken('ghp_abc');

    expect(await hasGithubToken()).toBe(true);
  });

  it('로그아웃하면 키체인에서 토큰이 사라진다', async () => {
    await setGithubToken('ghp_abc');

    await removeGithubToken();

    expect(keychain.has('github_pat')).toBe(false);
    expect(await getGithubToken()).toBeNull();
  });
});
