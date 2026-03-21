mod commands;

use commands::backup;
use commands::config;
use commands::themes;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
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
        .invoke_handler(tauri::generate_handler![
            config::read_ghostty_config,
            config::write_ghostty_config,
            config::get_config_path,
            config::read_file,
            config::write_file,
            backup::list_backups,
            backup::create_backup,
            backup::read_backup,
            backup::restore_backup,
            backup::delete_backup,
            backup::get_backup_locations,
            themes::list_custom_themes,
            themes::read_theme,
            themes::save_theme,
            themes::delete_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
