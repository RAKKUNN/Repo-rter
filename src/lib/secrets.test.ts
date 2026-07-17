import { describe, it, expect, beforeEach, vi } from 'vitest';

const { keychain, tauri } = vi.hoisted(() => ({
  keychain: new Map<string, string>(),
  tauri: { enabled: true },
}));

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => tauri.enabled,
  invoke: vi.fn(async (cmd: string, args: { key: string; value?: string }) => {
    if (cmd === 'set_secret') { keychain.set(args.key, args.value!); return null; }
    if (cmd === 'get_secret') { return keychain.get(args.key) ?? null; }
    if (cmd === 'delete_secret') { keychain.delete(args.key); return null; }
    throw new Error(`unexpected command: ${cmd}`);
  }),
}));

import { getSecret, setSecret, deleteSecret, migrateSecretsFromLocalStorage } from '@/lib/secrets';

describe('secrets', () => {
  beforeEach(() => {
    keychain.clear();
    window.localStorage.clear();
    tauri.enabled = true;
  });

  describe('Tauri 경로', () => {
    it('키체인에 저장하고 다시 읽는다', async () => {
      await setSecret('github_pat', 'ghp_abc');

      expect(keychain.get('github_pat')).toBe('ghp_abc');
      expect(await getSecret('github_pat')).toBe('ghp_abc');
    });

    it('시크릿을 평문 localStorage에 남기지 않는다', async () => {
      await setSecret('github_pat', 'ghp_abc');

      expect(window.localStorage.getItem('github_pat')).toBeNull();
    });

    it('저장할 때 남아있던 레거시 평문을 치운다', async () => {
      window.localStorage.setItem('github_pat', 'ghp_legacy');

      await setSecret('github_pat', 'ghp_new');

      expect(window.localStorage.getItem('github_pat')).toBeNull();
      expect(await getSecret('github_pat')).toBe('ghp_new');
    });

    it('없는 시크릿은 null을 반환한다', async () => {
      expect(await getSecret('github_pat')).toBeNull();
    });

    it('키체인이 비었으면 레거시 평문을 읽는다 (마이그레이션 전에도 앱이 뜬다)', async () => {
      window.localStorage.setItem('github_pat', 'ghp_legacy');

      expect(await getSecret('github_pat')).toBe('ghp_legacy');
    });

    it('삭제하면 키체인과 레거시 평문이 모두 사라진다', async () => {
      window.localStorage.setItem('github_pat', 'ghp_legacy');
      await setSecret('github_pat', 'ghp_abc');

      await deleteSecret('github_pat');

      expect(await getSecret('github_pat')).toBeNull();
      expect(window.localStorage.getItem('github_pat')).toBeNull();
    });
  });

  describe('브라우저 경로', () => {
    beforeEach(() => { tauri.enabled = false; });

    it('localStorage를 쓰고 키체인을 건드리지 않는다', async () => {
      await setSecret('github_pat', 'ghp_abc');

      expect(window.localStorage.getItem('github_pat')).toBe('ghp_abc');
      expect(await getSecret('github_pat')).toBe('ghp_abc');
      expect(keychain.size).toBe(0);
    });
  });

  describe('마이그레이션', () => {
    it('시크릿 3종을 모두 키체인으로 옮기고 평문을 지운다', async () => {
      window.localStorage.setItem('github_pat', 'ghp_abc');
      window.localStorage.setItem('sync_webdav_pass', 'dav_pw');
      window.localStorage.setItem('sync_encryption_key', 'passphrase');

      await migrateSecretsFromLocalStorage();

      expect(keychain.get('github_pat')).toBe('ghp_abc');
      expect(keychain.get('sync_webdav_pass')).toBe('dav_pw');
      expect(keychain.get('sync_encryption_key')).toBe('passphrase');
      expect(window.localStorage.getItem('github_pat')).toBeNull();
      expect(window.localStorage.getItem('sync_webdav_pass')).toBeNull();
      expect(window.localStorage.getItem('sync_encryption_key')).toBeNull();
    });

    it('시크릿이 아닌 값은 건드리지 않는다', async () => {
      window.localStorage.setItem('sync_webdav_url', 'https://dav.example.com');
      window.localStorage.setItem('sync_webdav_user', 'alice');
      window.localStorage.setItem('data_retention_days', '90');

      await migrateSecretsFromLocalStorage();

      expect(window.localStorage.getItem('sync_webdav_url')).toBe('https://dav.example.com');
      expect(window.localStorage.getItem('sync_webdav_user')).toBe('alice');
      expect(window.localStorage.getItem('data_retention_days')).toBe('90');
      expect(keychain.size).toBe(0);
    });

    it('키체인 쓰기가 실패하면 평문을 지우지 않는다', async () => {
      // sync_encryption_key를 잃으면 원격 백업을 영구히 복호화할 수 없다.
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockRejectedValueOnce(new Error('keychain locked'));
      window.localStorage.setItem('sync_encryption_key', 'passphrase');

      await migrateSecretsFromLocalStorage();

      expect(window.localStorage.getItem('sync_encryption_key')).toBe('passphrase');
    });

    it('읽어서 대조한 값이 다르면 평문을 지우지 않는다', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockImplementationOnce(async () => null)   // set_secret: 성공한 척
        .mockImplementationOnce(async () => 'corrupted');           // get_secret: 다른 값
      window.localStorage.setItem('sync_encryption_key', 'passphrase');

      await migrateSecretsFromLocalStorage();

      expect(window.localStorage.getItem('sync_encryption_key')).toBe('passphrase');
    });

    it('브라우저에서는 아무것도 하지 않는다', async () => {
      tauri.enabled = false;
      window.localStorage.setItem('github_pat', 'ghp_abc');

      await migrateSecretsFromLocalStorage();

      expect(window.localStorage.getItem('github_pat')).toBe('ghp_abc');
      expect(keychain.size).toBe(0);
    });
  });
});
