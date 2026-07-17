use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use std::fs;

mod secrets;

#[tauri::command]
fn save_traffic_data(app_handle: tauri::AppHandle, repo_key: String, data_type: String, data: String) -> Result<(), String> {
    let mut path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    
    let safe_repo_key = repo_key.replace("/", "__");
    let filename = format!("traffic_{}_{}.json", data_type, safe_repo_key);
    path.push(filename);
    
    fs::write(path, data).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_traffic_data(app_handle: tauri::AppHandle, repo_key: String, data_type: String) -> Result<String, String> {
    let mut path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    
    let safe_repo_key = repo_key.replace("/", "__");
    let filename = format!("traffic_{}_{}.json", data_type, safe_repo_key);
    path.push(filename);
    
    if !path.exists() {
        return Ok("[]".to_string());
    }
    
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn clean_expired_traffic_data(app_handle: tauri::AppHandle, threshold_str: String) -> Result<(), String> {
    let path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    if !path.exists() {
        return Ok(());
    }
    
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_path = entry.path();
        if file_path.is_file() {
            let filename = file_path.file_name().unwrap().to_string_lossy();
            if filename.starts_with("traffic_views_") || filename.starts_with("traffic_clones_") {
                let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
                if let Ok(mut json_arr) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(arr) = json_arr.as_array_mut() {
                        let original_len = arr.len();
                        
                        arr.retain(|item| {
                            if let Some(timestamp) = item.get("timestamp").and_then(|t| t.as_str()) {
                                timestamp >= threshold_str.as_str()
                            } else {
                                true
                            }
                        });
                        
                        if arr.len() != original_len {
                            let updated_content = serde_json::to_string(arr).map_err(|e| e.to_string())?;
                            fs::write(&file_path, updated_content).map_err(|e| e.to_string())?;
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn bundle_traffic_cache(app_handle: tauri::AppHandle) -> Result<String, String> {
    let path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    if !path.exists() {
        return Ok("{\"views\":{},\"clones\":{}}".to_string());
    }
    
    let mut views_map = serde_json::Map::new();
    let mut clones_map = serde_json::Map::new();
    
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_path = entry.path();
        if file_path.is_file() {
            let filename = file_path.file_name().unwrap().to_string_lossy();
            if filename.starts_with("traffic_views_") && filename.ends_with(".json") {
                let safe_repo_key = &filename["traffic_views_".len()..filename.len() - ".json".len()];
                let repo_key = safe_repo_key.replace("__", "/");
                let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
                if let Ok(json_arr) = serde_json::from_str::<serde_json::Value>(&content) {
                    views_map.insert(repo_key, json_arr);
                }
            } else if filename.starts_with("traffic_clones_") && filename.ends_with(".json") {
                let safe_repo_key = &filename["traffic_clones_".len()..filename.len() - ".json".len()];
                let repo_key = safe_repo_key.replace("__", "/");
                let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
                if let Ok(json_arr) = serde_json::from_str::<serde_json::Value>(&content) {
                    clones_map.insert(repo_key, json_arr);
                }
            }
        }
    }
    
    let mut bundle = serde_json::Map::new();
    bundle.insert("views".to_string(), serde_json::Value::Object(views_map));
    bundle.insert("clones".to_string(), serde_json::Value::Object(clones_map));
    
    serde_json::to_string(&serde_json::Value::Object(bundle)).map_err(|e| e.to_string())
}

fn merge_lists(existing: &Vec<serde_json::Value>, incoming: &Vec<serde_json::Value>) -> Vec<serde_json::Value> {
    let mut map = std::collections::BTreeMap::new();
    for item in existing {
        if let Some(timestamp) = item.get("timestamp").and_then(|t| t.as_str()) {
            let date_key = if timestamp.len() >= 10 { &timestamp[..10] } else { timestamp };
            map.insert(date_key.to_string(), item.clone());
        }
    }
    for item in incoming {
        if let Some(timestamp) = item.get("timestamp").and_then(|t| t.as_str()) {
            let date_key = if timestamp.len() >= 10 { &timestamp[..10] } else { timestamp };
            map.insert(date_key.to_string(), item.clone());
        }
    }
    map.into_values().collect()
}

#[tauri::command]
fn merge_bundled_traffic_data(app_handle: tauri::AppHandle, bundle_json: String) -> Result<(), String> {
    let path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    
    let bundle_val: serde_json::Value = serde_json::from_str(&bundle_json).map_err(|e| e.to_string())?;
    let bundle_obj = bundle_val.as_object().ok_or("Invalid bundle structure")?;
    
    let empty_map = serde_json::Map::new();
    let views = bundle_obj.get("views").and_then(|v| v.as_object()).unwrap_or(&empty_map);
    let clones = bundle_obj.get("clones").and_then(|c| c.as_object()).unwrap_or(&empty_map);
    
    // Process views
    for (repo_key, incoming_val) in views {
        if let Some(incoming_arr) = incoming_val.as_array() {
            let safe_repo_key = repo_key.replace("/", "__");
            let mut file_path = path.clone();
            file_path.push(format!("traffic_views_{}.json", safe_repo_key));
            
            let existing_arr = if file_path.exists() {
                let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
                serde_json::from_str::<Vec<serde_json::Value>>(&content).unwrap_or_default()
            } else {
                Vec::new()
            };
            
            let merged = merge_lists(&existing_arr, incoming_arr);
            let updated_content = serde_json::to_string(&merged).map_err(|e| e.to_string())?;
            fs::write(file_path, updated_content).map_err(|e| e.to_string())?;
        }
    }
    
    // Process clones
    for (repo_key, incoming_val) in clones {
        if let Some(incoming_arr) = incoming_val.as_array() {
            let safe_repo_key = repo_key.replace("/", "__");
            let mut file_path = path.clone();
            file_path.push(format!("traffic_clones_{}.json", safe_repo_key));
            
            let existing_arr = if file_path.exists() {
                let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
                serde_json::from_str::<Vec<serde_json::Value>>(&content).unwrap_or_default()
            } else {
                Vec::new()
            };
            
            let merged = merge_lists(&existing_arr, incoming_arr);
            let updated_content = serde_json::to_string(&merged).map_err(|e| e.to_string())?;
            fs::write(file_path, updated_content).map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_traffic_data, 
            load_traffic_data, 
            clean_expired_traffic_data,
            bundle_traffic_cache,
            merge_bundled_traffic_data,
            secrets::set_secret,
            secrets::get_secret,
            secrets::delete_secret
        ])
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show App", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::merge_lists;
    use serde_json::json;

    fn point(timestamp: &str, count: u64) -> serde_json::Value {
        json!({ "timestamp": timestamp, "count": count, "uniques": 1 })
    }

    #[test]
    fn merges_disjoint_days_in_chronological_order() {
        let existing = vec![point("2026-06-01T00:00:00Z", 10)];
        let incoming = vec![point("2026-05-01T00:00:00Z", 5)];

        let merged = merge_lists(&existing, &incoming);

        assert_eq!(merged.len(), 2);
        assert_eq!(merged[0]["timestamp"], "2026-05-01T00:00:00Z");
        assert_eq!(merged[1]["timestamp"], "2026-06-01T00:00:00Z");
    }

    #[test]
    fn incoming_overwrites_same_day() {
        let existing = vec![point("2026-06-01T00:00:00Z", 10)];
        let incoming = vec![point("2026-06-01T00:00:00Z", 42)];

        let merged = merge_lists(&existing, &incoming);

        assert_eq!(merged.len(), 1, "같은 날짜가 중복 항목을 만들면 안 된다");
        assert_eq!(merged[0]["count"], 42);
    }

    #[test]
    fn same_day_different_clock_times_collapse_to_one_entry() {
        // 병합 키는 timestamp의 앞 10자다. GitHub가 같은 날을 다른 시각으로
        // 돌려줘도 하루당 한 항목이어야 한다.
        let existing = vec![point("2026-06-01T00:00:00Z", 10)];
        let incoming = vec![point("2026-06-01T13:45:00Z", 11)];

        let merged = merge_lists(&existing, &incoming);

        assert_eq!(merged.len(), 1);
        assert_eq!(merged[0]["count"], 11);
    }

    #[test]
    fn retains_history_beyond_github_14_day_window() {
        // 앱의 존재 이유: GitHub 응답에서 빠진 과거 데이터가 살아남아야 한다.
        let existing = vec![point("2026-01-01T00:00:00Z", 1), point("2026-02-01T00:00:00Z", 2)];
        let incoming = vec![point("2026-07-01T00:00:00Z", 3)];

        let merged = merge_lists(&existing, &incoming);

        assert_eq!(merged.len(), 3);
        assert_eq!(merged[0]["timestamp"], "2026-01-01T00:00:00Z");
        assert_eq!(merged[2]["timestamp"], "2026-07-01T00:00:00Z");
    }

    #[test]
    fn drops_entries_without_timestamp() {
        let existing = vec![json!({ "count": 1 })];
        let incoming = vec![point("2026-06-01T00:00:00Z", 2)];

        let merged = merge_lists(&existing, &incoming);

        assert_eq!(merged.len(), 1);
        assert_eq!(merged[0]["timestamp"], "2026-06-01T00:00:00Z");
    }

    #[test]
    fn empty_incoming_preserves_existing() {
        let existing = vec![point("2026-06-01T00:00:00Z", 10)];

        let merged = merge_lists(&existing, &vec![]);

        assert_eq!(merged.len(), 1);
        assert_eq!(merged[0]["count"], 10);
    }
}
