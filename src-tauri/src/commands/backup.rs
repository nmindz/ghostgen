use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::PathBuf;
use std::time::SystemTime;
use tar::{Archive, Builder};

#[derive(serde::Serialize)]
pub struct BackupEntry {
    pub filename: String,
    pub timestamp: String,
    pub label: Option<String>,
    pub size_bytes: u64,
    pub has_themes: bool,
}

#[derive(serde::Serialize)]
pub struct RestoreResult {
    pub config_restored: bool,
    pub themes_restored: u32,
    pub themes_skipped: u32,
    pub themes_renamed: u32,
}

fn ghostty_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".config").join("ghostty")
}

fn ghostty_config_path() -> PathBuf {
    ghostty_dir().join("config")
}

fn ghostty_themes_dir() -> PathBuf {
    ghostty_dir().join("themes")
}

fn default_backups_dir() -> PathBuf {
    ghostty_dir().join("backups")
}

fn xdg_backups_dir() -> Result<PathBuf, String> {
    let config = dirs::config_dir().ok_or("Could not find config directory")?;
    Ok(config.join("ghostgen").join("backups"))
}

fn resolve_backups_dir(location: &str) -> Result<PathBuf, String> {
    let dir = match location {
        "default" | "" => default_backups_dir(),
        "xdg" => xdg_backups_dir()?,
        custom => PathBuf::from(custom),
    };
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create backups directory: {}", e))?;
    }
    Ok(dir)
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
    let days = secs / 86400;
    let time_of_day = secs % 86400;
    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;

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

    format!(
        "{:04}-{:02}-{:02}_{:02}-{:02}-{:02}",
        y,
        m + 1,
        remaining_days + 1,
        hours,
        minutes,
        seconds
    )
}

fn is_leap_year(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

fn parse_entry(filename: &str, size_bytes: u64, has_themes: bool) -> BackupEntry {
    let stem = filename
        .strip_suffix(".tar.gz")
        .or_else(|| filename.strip_suffix(".conf"))
        .unwrap_or(filename);

    let (timestamp, label) = if stem.len() > 19 && stem.as_bytes()[19] == b'_' {
        (
            stem[..19].to_string(),
            Some(stem[20..].replace('_', " ")),
        )
    } else {
        (stem.to_string(), None)
    };

    BackupEntry {
        filename: filename.to_string(),
        timestamp,
        label,
        size_bytes,
        has_themes,
    }
}

fn sha256_hex(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

#[tauri::command]
pub fn list_backups(location: Option<String>) -> Result<Vec<BackupEntry>, String> {
    let dir = resolve_backups_dir(&location.unwrap_or_default())?;
    let mut entries: Vec<BackupEntry> = Vec::new();

    if !dir.exists() {
        return Ok(entries);
    }

    let read_dir =
        fs::read_dir(&dir).map_err(|e| format!("Failed to read backups directory: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let filename = entry.file_name().to_string_lossy().to_string();

        if filename.ends_with(".tar.gz") {
            let metadata =
                fs::metadata(&path).map_err(|e| format!("Failed to read metadata: {}", e))?;
            // Check if archive contains themes by reading header
            let has_themes = check_archive_has_themes(&path).unwrap_or(false);
            entries.push(parse_entry(&filename, metadata.len(), has_themes));
        } else if filename.ends_with(".conf") {
            // Legacy plain-text backups
            let metadata =
                fs::metadata(&path).map_err(|e| format!("Failed to read metadata: {}", e))?;
            entries.push(parse_entry(&filename, metadata.len(), false));
        }
    }

    entries.sort_by(|a, b| b.filename.cmp(&a.filename));
    Ok(entries)
}

fn check_archive_has_themes(path: &PathBuf) -> Result<bool, String> {
    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    let decoder = GzDecoder::new(file);
    let mut archive = Archive::new(decoder);
    let entries = archive.entries().map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path().map_err(|e| e.to_string())?;
        if path.starts_with("themes/") {
            return Ok(true);
        }
    }
    Ok(false)
}

#[tauri::command]
pub fn create_backup(
    label: Option<String>,
    include_themes: Option<bool>,
    location: Option<String>,
) -> Result<BackupEntry, String> {
    let dir = resolve_backups_dir(&location.unwrap_or_default())?;
    let config_path = ghostty_config_path();

    if !config_path.exists() {
        return Err("Ghostty config file not found".to_string());
    }

    let now = SystemTime::now();
    let ts = format_timestamp(now);
    let include_themes = include_themes.unwrap_or(false);

    let filename = match &label {
        Some(l) if !l.trim().is_empty() => {
            let sanitized = l.trim().replace(' ', "_");
            format!("{}_{}.tar.gz", ts, sanitized)
        }
        _ => format!("{}.tar.gz", ts),
    };

    let dest = dir.join(&filename);
    let file =
        fs::File::create(&dest).map_err(|e| format!("Failed to create backup file: {}", e))?;
    let encoder = GzEncoder::new(file, Compression::default());
    let mut builder = Builder::new(encoder);

    // Add config file
    let config_data =
        fs::read(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;
    let mut header = tar::Header::new_gnu();
    header.set_size(config_data.len() as u64);
    header.set_mode(0o644);
    header.set_cksum();
    builder
        .append_data(&mut header, "config", &config_data[..])
        .map_err(|e| format!("Failed to add config to archive: {}", e))?;

    // Add themes if requested
    if include_themes {
        let themes_dir = ghostty_themes_dir();
        if themes_dir.exists() {
            let read_dir = fs::read_dir(&themes_dir)
                .map_err(|e| format!("Failed to read themes directory: {}", e))?;
            for entry in read_dir {
                let entry = entry.map_err(|e| format!("Failed to read theme entry: {}", e))?;
                let path = entry.path();
                if path.is_file() {
                    let theme_name = entry.file_name().to_string_lossy().to_string();
                    let theme_data =
                        fs::read(&path).map_err(|e| format!("Failed to read theme: {}", e))?;
                    let mut th = tar::Header::new_gnu();
                    th.set_size(theme_data.len() as u64);
                    th.set_mode(0o644);
                    th.set_cksum();
                    builder
                        .append_data(&mut th, format!("themes/{}", theme_name), &theme_data[..])
                        .map_err(|e| format!("Failed to add theme to archive: {}", e))?;
                }
            }
        }
    }

    builder
        .finish()
        .map_err(|e| format!("Failed to finalize archive: {}", e))?;

    let metadata =
        fs::metadata(&dest).map_err(|e| format!("Failed to read metadata: {}", e))?;

    Ok(parse_entry(&filename, metadata.len(), include_themes))
}

#[tauri::command]
pub fn read_backup(
    filename: String,
    location: Option<String>,
) -> Result<String, String> {
    validate_filename(&filename)?;
    let dir = resolve_backups_dir(&location.unwrap_or_default())?;
    let path = dir.join(&filename);

    if filename.ends_with(".tar.gz") {
        let file = fs::File::open(&path).map_err(|e| format!("Failed to open backup: {}", e))?;
        let decoder = GzDecoder::new(file);
        let mut archive = Archive::new(decoder);
        let entries = archive
            .entries()
            .map_err(|e| format!("Failed to read archive: {}", e))?;

        for entry in entries {
            let mut entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let entry_path = entry
                .path()
                .map_err(|e| format!("Failed to read path: {}", e))?
                .to_path_buf();
            if entry_path == PathBuf::from("config") {
                let mut content = String::new();
                entry
                    .read_to_string(&mut content)
                    .map_err(|e| format!("Failed to read config: {}", e))?;
                return Ok(content);
            }
        }
        Err("Config not found in archive".to_string())
    } else {
        fs::read_to_string(&path).map_err(|e| format!("Failed to read backup: {}", e))
    }
}

#[tauri::command]
pub fn restore_backup(
    filename: String,
    restore_themes: Option<bool>,
    theme_mode: Option<String>,
    location: Option<String>,
) -> Result<RestoreResult, String> {
    validate_filename(&filename)?;
    let dir = resolve_backups_dir(&location.unwrap_or_default())?;
    let backup_path = dir.join(&filename);
    let config_path = ghostty_config_path();

    if !backup_path.exists() {
        return Err("Backup file not found".to_string());
    }

    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config dir: {}", e))?;
    }

    let restore_themes = restore_themes.unwrap_or(false);
    let theme_mode = theme_mode.unwrap_or_else(|| "merge".to_string());

    if filename.ends_with(".tar.gz") {
        let file =
            fs::File::open(&backup_path).map_err(|e| format!("Failed to open backup: {}", e))?;
        let decoder = GzDecoder::new(file);
        let mut archive = Archive::new(decoder);

        let mut config_restored = false;
        let mut themes_restored: u32 = 0;
        let mut themes_skipped: u32 = 0;
        let mut themes_renamed: u32 = 0;

        // First pass: read all entries into memory
        let mut config_data: Option<Vec<u8>> = None;
        let mut backup_themes: HashMap<String, Vec<u8>> = HashMap::new();

        let entries = archive
            .entries()
            .map_err(|e| format!("Failed to read archive: {}", e))?;

        for entry in entries {
            let mut entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let entry_path = entry
                .path()
                .map_err(|e| format!("Failed to read path: {}", e))?
                .to_path_buf();

            let mut data = Vec::new();
            entry
                .read_to_end(&mut data)
                .map_err(|e| format!("Failed to read data: {}", e))?;

            if entry_path == PathBuf::from("config") {
                config_data = Some(data);
            } else if let Ok(stripped) = entry_path.strip_prefix("themes/") {
                if let Some(name) = stripped.to_str() {
                    if !name.is_empty() {
                        backup_themes.insert(name.to_string(), data);
                    }
                }
            }
        }

        // Restore config
        if let Some(data) = config_data {
            fs::write(&config_path, &data)
                .map_err(|e| format!("Failed to restore config: {}", e))?;
            config_restored = true;
        }

        // Restore themes
        if restore_themes && !backup_themes.is_empty() {
            let themes_dir = ghostty_themes_dir();
            fs::create_dir_all(&themes_dir)
                .map_err(|e| format!("Failed to create themes dir: {}", e))?;

            if theme_mode == "replace" {
                // Delete all existing custom themes, then write backup themes
                if themes_dir.exists() {
                    let existing = fs::read_dir(&themes_dir)
                        .map_err(|e| format!("Failed to read themes dir: {}", e))?;
                    for entry in existing {
                        if let Ok(entry) = entry {
                            let _ = fs::remove_file(entry.path());
                        }
                    }
                }
                for (name, data) in &backup_themes {
                    fs::write(themes_dir.join(name), data)
                        .map_err(|e| format!("Failed to write theme {}: {}", name, e))?;
                    themes_restored += 1;
                }
            } else {
                // Merge mode
                let backup_label = filename
                    .strip_suffix(".tar.gz")
                    .unwrap_or(&filename);

                for (name, data) in &backup_themes {
                    let dest = themes_dir.join(name);
                    if dest.exists() {
                        let existing_data = fs::read(&dest)
                            .map_err(|e| format!("Failed to read existing theme: {}", e))?;
                        let existing_sha = sha256_hex(&existing_data);
                        let backup_sha = sha256_hex(data);

                        if existing_sha == backup_sha {
                            themes_skipped += 1;
                        } else {
                            // Different content — save with backup name appended
                            let renamed = format!("{}_{}", name, backup_label);
                            fs::write(themes_dir.join(&renamed), data).map_err(|e| {
                                format!("Failed to write renamed theme: {}", e)
                            })?;
                            themes_renamed += 1;
                        }
                    } else {
                        fs::write(&dest, data)
                            .map_err(|e| format!("Failed to write theme: {}", e))?;
                        themes_restored += 1;
                    }
                }
            }
        }

        Ok(RestoreResult {
            config_restored,
            themes_restored,
            themes_skipped,
            themes_renamed,
        })
    } else {
        // Legacy .conf backup — just copy
        fs::copy(&backup_path, &config_path)
            .map_err(|e| format!("Failed to restore backup: {}", e))?;
        Ok(RestoreResult {
            config_restored: true,
            themes_restored: 0,
            themes_skipped: 0,
            themes_renamed: 0,
        })
    }
}

#[tauri::command]
pub fn delete_backup(
    filename: String,
    location: Option<String>,
) -> Result<(), String> {
    validate_filename(&filename)?;
    let dir = resolve_backups_dir(&location.unwrap_or_default())?;
    let path = dir.join(&filename);

    if !path.exists() {
        return Err("Backup file not found".to_string());
    }

    fs::remove_file(&path).map_err(|e| format!("Failed to delete backup: {}", e))
}

#[tauri::command]
pub fn get_backup_locations() -> Result<Vec<(String, String)>, String> {
    let default_path = default_backups_dir();
    let xdg_path = xdg_backups_dir()?;

    Ok(vec![
        (
            "default".to_string(),
            default_path.to_string_lossy().to_string(),
        ),
        ("xdg".to_string(), xdg_path.to_string_lossy().to_string()),
    ])
}
