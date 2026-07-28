use actix_web::{web, HttpResponse};
use rusqlite::params;
use uuid::Uuid;

use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::share::CreateShareRequest;

pub async fn create_share(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
    body: web::Json<CreateShareRequest>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let owner_id: i64 = conn.query_row(
        "SELECT owner_id FROM images WHERE id = ?1",
        params![image_id],
        |row| row.get(0),
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    if owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    let token = Uuid::new_v4().to_string();
    let expires_at = body.expires_in_hours.map(|h| {
        chrono::Utc::now()
            .checked_add_signed(chrono::Duration::hours(h))
            .unwrap_or_else(|| chrono::Utc::now())
            .format("%Y-%m-%d %H:%M:%S")
            .to_string()
    });

    conn.execute(
        "INSERT INTO share_links (image_id, token, owner_id, expires_at) VALUES (?1, ?2, ?3, ?4)",
        params![image_id, token, user.user_id, expires_at],
    )?;

    Ok(HttpResponse::Created().json(serde_json::json!({
        "token": token,
        "image_id": image_id,
        "expires_at": expires_at,
    })))
}

pub async fn get_share(
    db: web::Data<Database>,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let token = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let share: (i64, Option<String>) = conn.query_row(
        "SELECT image_id, expires_at FROM share_links WHERE token = ?1",
        params![token],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|_| AppError::NotFound("Share link not found".into()))?;

    if let Some(ref expires) = share.1 {
        if let Ok(exp) = chrono::NaiveDateTime::parse_from_str(expires, "%Y-%m-%d %H:%M:%S") {
            if chrono::Utc::now().naive_utc() > exp {
                return Err(AppError::NotFound("Share link expired".into()));
            }
        }
    }

    let image: (i64, String, String, String, i64) = conn.query_row(
        "SELECT id, original, mime_type, filename, size FROM images WHERE id = ?1",
        params![share.0],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "image_id": image.0,
        "original": image.1,
        "mime_type": image.2,
        "size": image.4,
        "download_url": format!("/api/share/{}/download", token),
    })))
}

pub async fn download_share(
    db: web::Data<Database>,
    config: web::Data<crate::config::Config>,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let token = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let share: (i64, Option<String>) = conn.query_row(
        "SELECT image_id, expires_at FROM share_links WHERE token = ?1",
        params![token],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|_| AppError::NotFound("Share link not found".into()))?;

    if let Some(ref expires) = share.1 {
        if let Ok(exp) = chrono::NaiveDateTime::parse_from_str(expires, "%Y-%m-%d %H:%M:%S") {
            if chrono::Utc::now().naive_utc() > exp {
                return Err(AppError::NotFound("Share link expired".into()));
            }
        }
    }

    let image: crate::models::image::Image = conn.query_row(
        "SELECT id, filename, original, mime_type, size, folder_id, owner_id, tags, width, height, created_at, updated_at, is_favorite FROM images WHERE id = ?1",
        params![share.0],
        |row| Ok(crate::models::image::Image {
            id: row.get(0)?,
            filename: row.get(1)?,
            original: row.get(2)?,
            mime_type: row.get(3)?,
            size: row.get(4)?,
            folder_id: row.get(5)?,
            owner_id: row.get(6)?,
            tags: row.get(7)?,
            width: row.get(8)?,
            height: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
            is_favorite: row.get(12)?,
        }),
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    drop(conn);

    let storage = crate::services::storage::StorageService::new(&config.storage_path);
    let data = storage.read_file(image.owner_id, &image.filename)?;

    Ok(HttpResponse::Ok()
        .content_type(image.mime_type.clone())
        .insert_header(("Content-Disposition", format!("inline; filename=\"{}\"", image.original)))
        .body(data))
}

pub async fn list_shares(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, image_id, token, owner_id, created_at, expires_at FROM share_links WHERE image_id = ?1 AND owner_id = ?2 ORDER BY created_at DESC"
    )?;

    let shares: Vec<serde_json::Value> = stmt.query_map(params![image_id, user.user_id], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i64>(0)?,
            "image_id": row.get::<_, i64>(1)?,
            "token": row.get::<_, String>(2)?,
            "owner_id": row.get::<_, i64>(3)?,
            "created_at": row.get::<_, String>(4)?,
            "expires_at": row.get::<_, Option<String>>(5)?,
        }))
    })?.filter_map(|r| r.ok()).collect();

    Ok(HttpResponse::Ok().json(shares))
}

pub async fn delete_share(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let token = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let rows = conn.execute(
        "DELETE FROM share_links WHERE token = ?1 AND owner_id = ?2",
        params![token, user.user_id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound("Share link not found".into()));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({ "deleted": true })))
}
