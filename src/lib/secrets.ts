import { isTauri, invoke } from '@tauri-apps/api/core';

/**
 * OS 키체인에 보관하는 시크릿. 이 목록에 없는 localStorage 항목
 * (sync_webdav_url, sync_provider 등)은 시크릿이 아니므로 건드리지 않는다.
 */
export const SECRET_KEYS = ['github_pat', 'sync_webdav_pass', 'sync_encryption_key'] as const;
export type SecretKey = (typeof SECRET_KEYS)[number];

export async function getSecret(key: SecretKey): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!isTauri()) return localStorage.getItem(key);

  const stored = await invoke<string | null>('get_secret', { key });
  if (stored !== null) return stored;

  // 키체인에 없다면 아직 이관되지 않은 평문일 수 있다.
  // 이 폴백 덕분에 마이그레이션 완료 여부와 무관하게 앱이 동작한다.
  // 마이그레이션이 평문을 지우면 여기서 자연히 null이 된다.
  return localStorage.getItem(key);
}

export async function setSecret(key: SecretKey, value: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!isTauri()) {
    localStorage.setItem(key, value);
    return;
  }

  // 키체인 실패 시 localStorage로 폴백하지 않는다.
  // 조용히 평문으로 쓰면 이 기능의 목적이 사라진다.
  await invoke('set_secret', { key, value });
  localStorage.removeItem(key);
}

export async function deleteSecret(key: SecretKey): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
  if (isTauri()) await invoke('delete_secret', { key });
}

/**
 * 0.4.3 이하에서 평문으로 저장된 시크릿을 키체인으로 옮긴다.
 * 키체인에 쓰고 읽어서 대조한 뒤에만 평문을 지운다 —
 * sync_encryption_key를 잃으면 원격 백업을 영구히 복호화할 수 없다.
 */
export async function migrateSecretsFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined' || !isTauri()) return;

  for (const key of SECRET_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy === null) continue;

    try {
      await invoke('set_secret', { key, value: legacy });

      const verified = await invoke<string | null>('get_secret', { key });
      if (verified !== legacy) {
        console.error(`Secret migration verification failed for ${key}; keeping the plaintext copy.`);
        continue;
      }

      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Secret migration failed for ${key}; keeping the plaintext copy.`, e);
    }
  }
}
