import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

// Detect if we are running inside Tauri
export const isTauri = () => {
  return typeof window !== 'undefined' && 
         (window.hasOwnProperty('__TAURI_INTERNALS__') || window.hasOwnProperty('__TAURI__'));
};

// Custom fetch that routes to Tauri's native HTTP client if available, avoiding CORS
export async function customFetch(url: string, options?: any) {
  if (isTauri()) {
    // Convert to Tauri's fetch syntax if needed, but it largely mimics standard fetch
    return tauriFetch(url, options);
  }
  
  // Fallback to standard fetch (will likely fail with CORS on GitHub login APIs in browser)
  return fetch(url, options);
}
