import { isTauri, invoke } from '@tauri-apps/api/core';

/**
 * OS 키체인에 보관하는 시크릿. 이 목록에 없는 localStorage 항목
 * (sync_webdav_url, sync_provider 등)은 시크릿이 아니므로 건드리지 않는다.
 */
export const SECRET_KEYS = ['github_pat', 'sync_webdav_pass', 'sync_encryption_key'] as const;
export type SecretKey = (typeof SECRET_KEYS)[number];

/**
 * 동시 요청(In-flight) 중복 제거 맵.
 * 앱 시작 시 수십 개의 API 요청이 동시에 getSecret('github_pat')을 호출해도
 * 단일 IPC Promise를 공유하여 중복 키체인 호출을 막는다.
 * (프로세스 수명 동안의 영구 메모리 캐시는 Rust 백엔드 `secrets.rs`의 Mutex 캐시가 담당한다.)
 */
const inFlightRequests = new Map<SecretKey, Promise<string | null>>();

export function clearSecretMemoryCache(): void {
  inFlightRequests.clear();
}

export async function getSecret(key: SecretKey): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!isTauri()) return localStorage.getItem(key);

  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = (async () => {
    try {
      const stored = await invoke<string | null>('get_secret', { key });
      if (stored !== null) return stored;

      // 키체인에 없다면 아직 이관되지 않은 평문일 수 있다.
      return localStorage.getItem(key);
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}

export async function setSecret(key: SecretKey, value: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!isTauri()) {
    localStorage.setItem(key, value);
    return;
  }

  inFlightRequests.delete(key);
  // 키체인 실패 시 localStorage로 폴백하지 않는다.
  await invoke('set_secret', { key, value });
  localStorage.removeItem(key);
}

export async function deleteSecret(key: SecretKey): Promise<void> {
  if (typeof window === 'undefined') return;
  inFlightRequests.delete(key);
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
