use actix_web::{web, HttpResponse};
use rusqlite::params;
use std::io::{Cursor, Write};
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::config::Config;
use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::zip::ZipDownloadRequest;

pub async fn download_zip(
    db: web::Data<Database>,
    config: web::Data<Config>,
    user: AuthUser,
    body: web::Json<ZipDownloadRequest>,
) -> Result<HttpResponse, AppError> {
    if body.ids.is_empty() {
        return Err(AppError::BadRequest("No image IDs provided".into()));
    }

    if body.ids.len() > 50 {
        return Err(AppError::BadRequest("Maximum 50 images per ZIP".into()));
    }

    let conn = db.conn.lock().unwrap();
    let mut images: Vec<(String, String, i64)> = Vec::new();

    for &id in &body.ids {
        let result: Result<(String, String, i64), _> = conn.query_row(
            "SELECT filename, original, owner_id FROM images WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        );

        match result {
            Ok(img) => {
                if img.2 == user.user_id || user.is_admin() {
                    images.push(img);
                }
            }
            Err(_) => continue,
        }
    }

    drop(conn);

    if images.is_empty() {
        return Err(AppError::NotFound("No accessible images found".into()));
    }

    let cursor = Cursor::new(Vec::new());
    let mut zip = ZipWriter::new(cursor);
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .compression_level(Some(6));

    for (filename, original, owner_id) in &images {
        let file_path = format!("{}/{}/{}", config.storage_path, owner_id, filename);
        if let Ok(data) = std::fs::read(&file_path) {
            zip.start_file(original, options)
                .map_err(|e| AppError::Internal(e.to_string()))?;
            zip.write_all(&data)
                .map_err(|e| AppError::Internal(e.to_string()))?;
        }
    }

    let result = zip.finish()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let zip_data = result.into_inner();

    Ok(HttpResponse::Ok()
        .content_type("application/zip")
        .insert_header(("Content-Disposition", "attachment; filename=\"images.zip\""))
        .body(zip_data))
}
