#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![open_url])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn open_url(url: String, app: tauri::AppHandle) -> Result<(), String> {
  use tauri_plugin_shell::ShellExt;
  let shell = app.shell();
  
  shell.open(&url, None)
    .map_err(|e| e.to_string())
}
