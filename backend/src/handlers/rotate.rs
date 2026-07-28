use actix_web::{web, HttpResponse};
use rusqlite::params;
use std::path::Path;

use crate::config::Config;
use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::rotate::RotateRequest;
use image::GenericImageView;

pub async fn rotate_image(
    db: web::Data<Database>,
    config: web::Data<Config>,
    user: AuthUser,
    path: web::Path<i64>,
    body: web::Json<RotateRequest>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let image: (String, String, i64) = conn.query_row(
        "SELECT filename, mime_type, owner_id FROM images WHERE id = ?1",
        params![image_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    if image.2 != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    drop(conn);

    let file_path = format!("{}/{}/{}", config.storage_path, image.2, image.0);

    if !Path::new(&file_path).exists() {
        return Err(AppError::NotFound("File not found on disk".into()));
    }

    let img = image::open(&file_path).map_err(|e| AppError::Internal(e.to_string()))?;

    let rotated = match body.degrees % 360 {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => return Err(AppError::BadRequest("Degrees must be 90, 180, or 270".into())),
    };

    rotated.save(&file_path).map_err(|e| AppError::Internal(e.to_string()))?;

    let (w, h) = rotated.dimensions();

    let conn2 = db.conn.lock().unwrap();
    conn2.execute(
        "UPDATE images SET width = ?1, height = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
        params![w as i64, h as i64, image_id],
    )?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "rotated": true,
        "degrees": body.degrees,
        "width": w,
        "height": h,
    })))
}
