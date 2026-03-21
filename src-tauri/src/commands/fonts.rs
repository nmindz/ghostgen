use font_kit::source::SystemSource;
use std::collections::BTreeSet;

#[tauri::command]
pub fn list_system_fonts() -> Result<Vec<String>, String> {
    let source = SystemSource::new();
    let families = source
        .all_families()
        .map_err(|e| format!("Failed to enumerate fonts: {}", e))?;

    let unique: BTreeSet<String> = families.into_iter().collect();
    Ok(unique.into_iter().collect())
}
