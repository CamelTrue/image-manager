use std::fs;
use std::path::Path;
use uuid::Uuid;
use crate::errors::AppError;

pub struct StorageService {
    base_path: String,
}

impl StorageService {
    pub fn new(base_path: &str) -> Self {
        Self {
            base_path: base_path.to_string(),
        }
    }

    pub fn ensure_dir(&self) -> Result<(), AppError> {
        fs::create_dir_all(&self.base_path)?;
        Ok(())
    }

    pub fn get_user_path(&self, user_id: i64) -> String {
        format!("{}/{}", self.base_path, user_id)
    }

    pub fn ensure_user_dir(&self, user_id: i64) -> Result<String, AppError> {
        let path = self.get_user_path(user_id);
        fs::create_dir_all(&path)?;
        Ok(path)
    }

    pub fn generate_filename(original: &str) -> String {
        let ext = Path::new(original)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("bin");
        format!("{}.{}", Uuid::new_v4(), ext)
    }

    pub fn save_file(&self, user_id: i64, filename: &str, data: &[u8]) -> Result<String, AppError> {
        let user_dir = self.ensure_user_dir(user_id)?;
        let path = format!("{}/{}", user_dir, filename);
        fs::write(&path, data)?;
        Ok(path)
    }

    pub fn delete_file(&self, user_id: i64, filename: &str) -> Result<(), AppError> {
        let path = format!("{}/{}/{}", self.base_path, user_id, filename);
        if Path::new(&path).exists() {
            fs::remove_file(&path)?;
        }
        Ok(())
    }

    pub fn rename_file(&self, user_id: i64, old_filename: &str, new_filename: &str) -> Result<(), AppError> {
        let old_path = format!("{}/{}/{}", self.base_path, user_id, old_filename);
        let new_path = format!("{}/{}/{}", self.base_path, user_id, new_filename);
        if Path::new(&old_path).exists() {
            fs::rename(&old_path, &new_path)?;
        }
        Ok(())
    }

    pub fn read_file(&self, user_id: i64, filename: &str) -> Result<Vec<u8>, AppError> {
        let path = format!("{}/{}/{}", self.base_path, user_id, filename);
        Ok(fs::read(&path)?)
    }
}
