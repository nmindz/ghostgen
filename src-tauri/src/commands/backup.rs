use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

#[derive(serde::Serialize)]
pub struct BackupEntry {
    pub filename: String,
    pub timestamp: String,
    pub label: Option<String>,
    pub size_bytes: u64,
}

fn backups_dir() -> Result<PathBuf, String> {
    let config = dirs::config_dir().ok_or("Could not find config directory")?;
    let dir = config.join("ghostgen").join("backups");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create backups directory: {}", e))?;
    }
    Ok(dir)
}

fn ghostty_config_path() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".config").join("ghostty").join("config")
}

fn validate_filename(filename: &str) -> Result<(), String> {
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        return Err("Invalid filename".to_string());
    }
    Ok(())
}

fn format_timestamp(time: SystemTime) -> String {
    let duration = time
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();

    // Manual UTC time calculation
    let days = secs / 86400;
    let time_of_day = secs % 86400;
    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;

    // Calculate year/month/day from days since epoch
    let mut y = 1970i64;
    let mut remaining_days = days as i64;

    loop {
        let days_in_year = if is_leap_year(y) { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        y += 1;
    }

    let month_days = if is_leap_year(y) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut m = 0usize;
    for (i, &md) in month_days.iter().enumerate() {
        if remaining_days < md {
            m = i;
            break;
        }
        remaining_days -= md;
    }

    let day = remaining_days + 1;
    let month = m + 1;

    format!(
        "{:04}-{:02}-{:02}_{:02}-{:02}-{:02}",
        y, month, day, hours, minutes, seconds
    )
}

fn is_leap_year(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

fn parse_entry(filename: &str, size_bytes: u64) -> BackupEntry {
    let stem = filename.strip_suffix(".conf").unwrap_or(filename);
    // Format: YYYY-MM-DD_HH-MM-SS or YYYY-MM-DD_HH-MM-SS_label
    let timestamp;
    let label;

    // The timestamp part is always the first 19 characters: YYYY-MM-DD_HH-MM-SS
    if stem.len() > 19 && stem.as_bytes()[19] == b'_' {
        timestamp = stem[..19].to_string();
        let raw_label = &stem[20..];
        label = Some(raw_label.replace('_', " "));
    } else {
        timestamp = stem.to_string();
        label = None;
    }

    BackupEntry {
        filename: filename.to_string(),
        timestamp,
        label,
        size_bytes,
    }
}

#[tauri::command]
pub fn list_backups() -> Result<Vec<BackupEntry>, String> {
    let dir = backups_dir()?;
    let mut entries: Vec<BackupEntry> = Vec::new();

    if !dir.exists() {
        return Ok(entries);
    }

    let read_dir = fs::read_dir(&dir).map_err(|e| format!("Failed to read backups directory: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("conf") {
            let filename = entry.file_name().to_string_lossy().to_string();
            let metadata = fs::metadata(&path).map_err(|e| format!("Failed to read metadata: {}", e))?;
            let size_bytes = metadata.len();
            entries.push(parse_entry(&filename, size_bytes));
        }
    }

    // Sort newest first (reverse alphabetical by filename since timestamps sort lexicographically)
    entries.sort_by(|a, b| b.filename.cmp(&a.filename));

    Ok(entries)
}

#[tauri::command]
pub fn create_backup(label: Option<String>) -> Result<BackupEntry, String> {
    let dir = backups_dir()?;
    let config_path = ghostty_config_path();

    if !config_path.exists() {
        return Err("Ghostty config file not found".to_string());
    }

    let now = SystemTime::now();
    let ts = format_timestamp(now);

    let filename = match &label {
        Some(l) if !l.trim().is_empty() => {
            let sanitized = l.trim().replace(' ', "_");
            format!("{}_{}.conf", ts, sanitized)
        }
        _ => format!("{}.conf", ts),
    };

    let dest = dir.join(&filename);
    fs::copy(&config_path, &dest).map_err(|e| format!("Failed to create backup: {}", e))?;

    let metadata = fs::metadata(&dest).map_err(|e| format!("Failed to read metadata: {}", e))?;

    Ok(parse_entry(&filename, metadata.len()))
}

#[tauri::command]
pub fn read_backup(filename: String) -> Result<String, String> {
    validate_filename(&filename)?;
    let dir = backups_dir()?;
    let path = dir.join(&filename);
    fs::read_to_string(&path).map_err(|e| format!("Failed to read backup: {}", e))
}

#[tauri::command]
pub fn restore_backup(filename: String) -> Result<(), String> {
    validate_filename(&filename)?;
    let dir = backups_dir()?;
    let backup_path = dir.join(&filename);
    let config_path = ghostty_config_path();

    if !backup_path.exists() {
        return Err("Backup file not found".to_string());
    }

    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create config dir: {}", e))?;
    }

    fs::copy(&backup_path, &config_path).map_err(|e| format!("Failed to restore backup: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn delete_backup(filename: String) -> Result<(), String> {
    validate_filename(&filename)?;
    let dir = backups_dir()?;
    let path = dir.join(&filename);

    if !path.exists() {
        return Err("Backup file not found".to_string());
    }

    fs::remove_file(&path).map_err(|e| format!("Failed to delete backup: {}", e))
}
