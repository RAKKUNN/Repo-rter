/**
 * Cryptography helper utilizing browser native Web Crypto API (AES-GCM-256)
 * for secure end-to-end encrypted synchronization.
 */

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM key from a passphrase using PBKDF2.
 */
async function deriveKey(passphrase: string, salt: Uint8Array, usages: KeyUsage[]): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
}

/**
 * Encrypts plaintext string using AES-GCM-256.
 * Returns a base64 string formatted as: salt(16 bytes) + iv(12 bytes) + ciphertext
 */
export async function encryptData(plaintext: string, passphrase?: string): Promise<string> {
  if (!passphrase) return plaintext;
  
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Generate random 16-byte salt for PBKDF2 and 12-byte IV for AES-GCM
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Derive encryption key
  const aesKey = await deriveKey(passphrase, salt, ['encrypt']);

  // Encrypt the bytes
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    plaintextBytes
  );

  const ciphertextBytes = new Uint8Array(ciphertextBuffer);

  // Combine salt + iv + ciphertext
  const combinedBytes = new Uint8Array(salt.length + iv.length + ciphertextBytes.length);
  combinedBytes.set(salt, 0);
  combinedBytes.set(iv, salt.length);
  combinedBytes.set(ciphertextBytes, salt.length + iv.length);

  return arrayBufferToBase64(combinedBytes.buffer);
}

/**
 * Decrypts base64 encoded ciphertext string using AES-GCM-256.
 * Expects base64 formatted as: salt(16 bytes) + iv(12 bytes) + ciphertext
 */
export async function decryptData(ciphertextWithMetadata: string, passphrase?: string): Promise<string> {
  if (!passphrase) return ciphertextWithMetadata;

  const combinedBytes = base64ToUint8Array(ciphertextWithMetadata);

  if (combinedBytes.length < 28) {
    throw new Error('Ciphertext is too short to be valid.');
  }

  // Extract salt (16 bytes) and iv (12 bytes)
  const salt = combinedBytes.slice(0, 16);
  const iv = combinedBytes.slice(16, 28);
  const ciphertextBytes = combinedBytes.slice(28);

  // Derive decryption key
  const aesKey = await deriveKey(passphrase, salt, ['decrypt']);

  // Decrypt the bytes
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    ciphertextBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
