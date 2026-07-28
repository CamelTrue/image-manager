use actix_web::{web, HttpResponse};
use rusqlite::params;
use std::path::Path;

use crate::config::Config;
use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;

pub async fn get_thumbnail(
    db: web::Data<Database>,
    config: web::Data<Config>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let image: (String, String, String, i64) = conn.query_row(
        "SELECT filename, original, mime_type, owner_id FROM images WHERE id = ?1",
        params![image_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    let owner_id = image.3;

    if owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    drop(conn);

    let storage = crate::services::storage::StorageService::new(&config.storage_path);
    let user_dir = storage.get_user_path(owner_id);

    let thumb_name = {
        let stem = Path::new(&image.0)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("");
        let ext = Path::new(&image.0)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("jpg");
        format!("{}_thumb.{}", stem, ext)
    };

    let thumb_path = format!("{}/{}", user_dir, thumb_name);

    if !Path::new(&thumb_path).exists() {
        let original_path = format!("{}/{}", user_dir, image.0);
        if !Path::new(&original_path).exists() {
            return Err(AppError::NotFound("Original file not found".into()));
        }

        let img = image::open(&original_path).map_err(|e| AppError::Internal(e.to_string()))?;
        let thumb = img.thumbnail(300, 300);
        thumb.save(&thumb_path).map_err(|e| AppError::Internal(e.to_string()))?;
    }

    let data = std::fs::read(&thumb_path).map_err(|e| AppError::Internal(e.to_string()))?;

    let content_type = if image.1.to_lowercase().ends_with(".png") {
        "image/png"
    } else if image.1.to_lowercase().ends_with(".webp") {
        "image/webp"
    } else {
        "image/jpeg"
    };

    Ok(HttpResponse::Ok()
        .content_type(content_type)
        .insert_header(("Cache-Control", "public, max-age=86400"))
        .body(data))
}
