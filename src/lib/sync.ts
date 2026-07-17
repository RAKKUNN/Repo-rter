import { isTauri, invoke } from '@tauri-apps/api/core';
import { fetch } from '@tauri-apps/plugin-http';
import { encryptData, decryptData } from './crypto';

// Helper to construct WebDAV Authorization header
function getAuthHeader(user: string, pass: string): string {
  return 'Basic ' + window.btoa(user + ':' + pass);
}

// Helper to format WebDAV URL
function getSyncFileUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') 
    ? `${baseUrl}repo_rter_sync.enc` 
    : `${baseUrl}/repo_rter_sync.enc`;
}

/**
 * Encrypts and uploads the local cache bundle to WebDAV server.
 */
export async function uploadSync(): Promise<void> {
  if (typeof window === 'undefined' || !isTauri()) return;

  const provider = localStorage.getItem('sync_provider');
  if (provider !== 'webdav') return;

  const url = localStorage.getItem('sync_webdav_url');
  const user = localStorage.getItem('sync_webdav_user');
  const pass = localStorage.getItem('sync_webdav_pass');
  const encryptionKey = localStorage.getItem('sync_encryption_key') || undefined;

  if (!url || !user || !pass) {
    throw new Error('WebDAV sync configuration is incomplete.');
  }

  // 1. Get bundled traffic data from Rust backend
  const bundleJson = await invoke<string>('bundle_traffic_cache');

  // 2. Encrypt the data
  const encryptedPayload = await encryptData(bundleJson, encryptionKey);

  // 3. Upload to WebDAV via PUT request
  const fileUrl = getSyncFileUrl(url);
  const auth = getAuthHeader(user, pass);

  const response = await fetch(fileUrl, {
    method: 'PUT',
    headers: {
      'Authorization': auth,
      'Content-Type': 'text/plain',
    },
    body: encryptedPayload,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Upload failed with status ${response.status}: ${errorText || response.statusText}`);
  }
}

/**
 * Downloads the encrypted cache bundle from WebDAV server, decrypts it,
 * and merges it with the local cache files.
 */
export async function downloadAndMergeSync(): Promise<boolean> {
  if (typeof window === 'undefined' || !isTauri()) return false;

  const provider = localStorage.getItem('sync_provider');
  if (provider !== 'webdav') return false;

  const url = localStorage.getItem('sync_webdav_url');
  const user = localStorage.getItem('sync_webdav_user');
  const pass = localStorage.getItem('sync_webdav_pass');
  const encryptionKey = localStorage.getItem('sync_encryption_key') || undefined;

  if (!url || !user || !pass) {
    throw new Error('WebDAV sync configuration is incomplete.');
  }

  const fileUrl = getSyncFileUrl(url);
  const auth = getAuthHeader(user, pass);

  // 1. Download file
  const response = await fetch(fileUrl, {
    method: 'GET',
    headers: {
      'Authorization': auth,
    },
  });

  if (response.status === 404) {
    console.log('No remote backup file found on WebDAV. This is normal for first-time sync.');
    return false; // No remote file to pull
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Download failed with status ${response.status}: ${errorText || response.statusText}`);
  }

  const encryptedPayload = await response.text();

  if (!encryptedPayload) {
    throw new Error('Downloaded backup payload is empty.');
  }

  // 2. Decrypt the data
  let decryptedJson: string;
  try {
    decryptedJson = await decryptData(encryptedPayload, encryptionKey);
  } catch (e) {
    throw new Error('Failed to decrypt sync file. Please check if your Encryption Passphrase is correct.');
  }

  // Quick structure check
  try {
    const parsed = JSON.parse(decryptedJson);
    if (!parsed || typeof parsed !== 'object' || (!parsed.views && !parsed.clones)) {
      throw new Error('Decrypted data is not a valid Repo-rter cache bundle.');
    }
  } catch (e: any) {
    throw new Error('Decrypted data is not valid JSON: ' + e.message);
  }

  // 3. Send to Rust backend for merging
  await invoke('merge_bundled_traffic_data', { bundleJson: decryptedJson });
  return true;
}
