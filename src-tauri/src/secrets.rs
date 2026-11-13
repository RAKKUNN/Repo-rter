use keyring::v1::{Entry, Error};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

/// 키체인 항목의 service 이름. tauri.conf.json의 identifier와 맞춘다.
const SERVICE: &str = "com.reporter.app";

/// 허용된 시크릿 키 화이트리스트. 임의의 키체인 항목 접근을 차단한다.
const ALLOWED_SECRET_KEYS: &[&str] = &[
    "github_pat",
    "sync_webdav_pass",
    "sync_encryption_key",
];

/// 프로세스 생명주기 동안 키체인 조회 결과를 메모리에 캐싱하여
/// macOS 개발 모드 등에서 키체인 비밀번호 프롬프트가 반복해서 뜨는 현상을 방지한다.
fn secret_cache() -> &'static Mutex<HashMap<String, Option<String>>> {
    static CACHE: OnceLock<Mutex<HashMap<String, Option<String>>>> = OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn validate_secret_key(key: &str) -> Result<(), String> {
    if ALLOWED_SECRET_KEYS.contains(&key) {
        Ok(())
    } else {
        Err(format!("Unauthorized secret key: {}", key))
    }
}

#[tauri::command]
pub fn set_secret(key: String, value: String) -> Result<(), String> {
    validate_secret_key(&key)?;
    let mut cache = secret_cache().lock().map_err(|e| e.to_string())?;
    Entry::new(SERVICE, &key)
        .map_err(|e| e.to_string())?
        .set_password(&value)
        .map_err(|e| e.to_string())?;
    cache.insert(key, Some(value));
    Ok(())
}

#[tauri::command]
pub fn get_secret(key: String) -> Result<Option<String>, String> {
    validate_secret_key(&key)?;
    // Hold the mutex lock across the OS Keychain lookup so concurrent IPC calls
    // never trigger parallel macOS Keychain password prompts.
    let mut cache = secret_cache().lock().map_err(|e| e.to_string())?;
    if let Some(cached) = cache.get(&key) {
        return Ok(cached.clone());
    }
    let entry = Entry::new(SERVICE, &key).map_err(|e| e.to_string())?;
    let result = match entry.get_password() {
        Ok(value) => Some(value),
        Err(Error::NoEntry) => None,
        Err(e) => return Err(e.to_string()),
    };
    cache.insert(key, result.clone());
    Ok(result)
}

#[tauri::command]
pub fn delete_secret(key: String) -> Result<(), String> {
    validate_secret_key(&key)?;
    let mut cache = secret_cache().lock().map_err(|e| e.to_string())?;
    cache.insert(key.clone(), None);
    let entry = Entry::new(SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        // 이미 없는 항목을 지우는 것은 성공으로 친다 (멱등).
        Ok(()) | Err(Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::validate_secret_key;

    #[test]
    fn allows_whitelisted_secret_keys() {
        assert!(validate_secret_key("github_pat").is_ok());
        assert!(validate_secret_key("sync_webdav_pass").is_ok());
        assert!(validate_secret_key("sync_encryption_key").is_ok());
    }

    #[test]
    fn rejects_unknown_secret_keys() {
        assert!(validate_secret_key("arbitrary_system_secret").is_err());
        assert!(validate_secret_key("../etc/passwd").is_err());
        assert!(validate_secret_key("").is_err());
    }
}
