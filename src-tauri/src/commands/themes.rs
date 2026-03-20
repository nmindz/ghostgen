use std::fs;
use std::path::PathBuf;

#[derive(serde::Serialize)]
pub struct ThemeEntry {
    pub name: String,
    pub filename: String,
}

fn themes_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let dir = home.join(".config").join("ghostty").join("themes");
    Ok(dir)
}

fn validate_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Theme name cannot be empty".to_string());
    }
    if name.contains("..") || name.contains('/') || name.contains('\\') {
        return Err("Invalid theme name".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn list_custom_themes() -> Result<Vec<ThemeEntry>, String> {
    let dir = themes_dir()?;
    let mut entries: Vec<ThemeEntry> = Vec::new();

    if !dir.exists() {
        return Ok(entries);
    }

    let read_dir =
        fs::read_dir(&dir).map_err(|e| format!("Failed to read themes directory: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.is_file() {
            let filename = entry.file_name().to_string_lossy().to_string();
            entries.push(ThemeEntry {
                name: filename.clone(),
                filename,
            });
        }
    }

    entries.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(entries)
}

#[tauri::command]
pub fn read_theme(name: String) -> Result<String, String> {
    validate_name(&name)?;
    let dir = themes_dir()?;
    let path = dir.join(&name);
    fs::read_to_string(&path).map_err(|e| format!("Failed to read theme: {}", e))
}

#[tauri::command]
pub fn save_theme(name: String, content: String) -> Result<(), String> {
    validate_name(&name)?;
    let dir = themes_dir()?;
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create themes directory: {}", e))?;
    }
    let path = dir.join(&name);
    fs::write(&path, content).map_err(|e| format!("Failed to save theme: {}", e))
}

#[tauri::command]
pub fn delete_theme(name: String) -> Result<(), String> {
    validate_name(&name)?;
    let dir = themes_dir()?;
    let path = dir.join(&name);
    if !path.exists() {
        return Err("Theme file not found".to_string());
    }
    fs::remove_file(&path).map_err(|e| format!("Failed to delete theme: {}", e))
}
