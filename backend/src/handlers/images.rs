use actix_web::{web, HttpResponse};
use actix_multipart::Multipart;
use futures_util::StreamExt;
use rusqlite::params;

use crate::config::Config;
use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::image::*;
use crate::services::storage::StorageService;
use image::GenericImageView;

const IMG_COLS: &str = "id, filename, original, mime_type, size, folder_id, owner_id, tags, width, height, is_favorite, deleted_at, created_at, updated_at";

fn row_to_image(row: &rusqlite::Row) -> rusqlite::Result<Image> {
    Ok(Image {
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
        is_favorite: row.get::<_, i64>(10)? != 0,
        deleted_at: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

pub async fn list_images(
    db: web::Data<Database>,
    user: AuthUser,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    let conn = db.conn.lock().unwrap();
    let folder_id = query.get("folder_id").and_then(|v| v.parse::<i64>().ok());
    let search = query.get("search").cloned();
    let tags = query.get("tags").cloned();
    let sort = query.get("sort").cloned().unwrap_or_else(|| "created_at".to_string());
    let order = query.get("order").cloned().unwrap_or_else(|| "DESC".to_string());
    let mime_type = query.get("mime_type").cloned();
    let min_size = query.get("min_size").and_then(|v| v.parse::<i64>().ok());
    let max_size = query.get("max_size").and_then(|v| v.parse::<i64>().ok());
    let favorite = query.get("favorite").cloned();
    let trashed = query.get("trashed").cloned();

    let mut sql = format!("SELECT {} FROM images WHERE owner_id = ?1", IMG_COLS);
    let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![Box::new(user.user_id)];

    if trashed.as_deref() == Some("true") {
        sql.push_str(" AND deleted_at IS NOT NULL");
    } else {
        sql.push_str(" AND deleted_at IS NULL");
    }

    if let Some(fid) = folder_id {
        sql.push_str(&format!(" AND folder_id = ?{}", param_values.len() + 1));
        param_values.push(Box::new(fid));
    }

    if let Some(ref s) = search {
        sql.push_str(&format!(" AND original LIKE ?{}", param_values.len() + 1));
        param_values.push(Box::new(format!("%{}%", s)));
    }

    if let Some(ref t) = tags {
        sql.push_str(&format!(" AND tags LIKE ?{}", param_values.len() + 1));
        param_values.push(Box::new(format!("%{}%", t)));
    }

    if let Some(ref m) = mime_type {
        sql.push_str(&format!(" AND mime_type LIKE ?{}", param_values.len() + 1));
        param_values.push(Box::new(format!("{}%", m)));
    }

    if let Some(ms) = min_size {
        sql.push_str(&format!(" AND size >= ?{}", param_values.len() + 1));
        param_values.push(Box::new(ms));
    }

    if let Some(ms) = max_size {
        sql.push_str(&format!(" AND size <= ?{}", param_values.len() + 1));
        param_values.push(Box::new(ms));
    }

    if let Some(ref f) = favorite {
        if f == "true" {
            sql.push_str(" AND is_favorite = 1");
        }
    }

    let valid_sorts = ["created_at", "original", "size", "updated_at"];
    let sort_col = if valid_sorts.contains(&sort.as_str()) { sort } else { "created_at".to_string() };
    let sort_dir = if order.to_uppercase() == "ASC" { "ASC" } else { "DESC" };
    sql.push_str(&format!(" ORDER BY {} {}", sort_col, sort_dir));

    let mut stmt = conn.prepare(&sql)?;
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();

    let images: Vec<ImageInfo> = stmt.query_map(params_refs.as_slice(), row_to_image)?
        .filter_map(|r| r.ok())
        .map(|img| img.to_info())
        .collect();

    Ok(HttpResponse::Ok().json(images))
}

pub async fn upload_image(
    db: web::Data<Database>,
    config: web::Data<Config>,
    user: AuthUser,
    mut payload: Multipart,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    let folder_id = query.get("folder_id").and_then(|v| v.parse::<i64>().ok());
    let storage = StorageService::new(&config.storage_path);

    let mut file_data: Option<Vec<u8>> = None;
    let mut original_name: Option<String> = None;
    let mut mime: Option<String> = None;

    while let Some(item) = payload.next().await {
        let mut field = item.map_err(|e| AppError::BadRequest(e.to_string()))?;
        if let Some(ref cd) = field.content_disposition() {
            let field_name = cd.get_name().unwrap_or("").to_string();

            if field_name == "file" {
                original_name = cd.get_filename().map(|s| s.to_string());
                mime = field.content_type().map(|m| m.to_string());
                let mut data = Vec::new();
                while let Some(chunk) = field.next().await {
                    let chunk = chunk.map_err(|e| AppError::BadRequest(e.to_string()))?;
                    data.extend_from_slice(&chunk);
                }
                file_data = Some(data);
            }
        }
    }

    let file_data = file_data.ok_or_else(|| AppError::BadRequest("No file provided".into()))?;
    let original_name = original_name.ok_or_else(|| AppError::BadRequest("No filename".into()))?;
    let mime = mime.unwrap_or_else(|| "application/octet-stream".to_string());

    let (width, height) = match image::load_from_memory(&file_data) {
        Ok(img) => {
            let (w, h) = img.dimensions();
            (w as i64, h as i64)
        }
        Err(_) => (0, 0),
    };

    let filename = StorageService::generate_filename(&original_name);
    storage.save_file(user.user_id, &filename, &file_data)?;

    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO images (filename, original, mime_type, size, folder_id, owner_id, width, height) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![filename, original_name, mime, file_data.len() as i64, folder_id, user.user_id, width, height],
    )?;

    let image_id = conn.last_insert_rowid();
    let image: Image = conn.query_row(
        &format!("SELECT {} FROM images WHERE id = ?1", IMG_COLS),
        params![image_id],
        row_to_image,
    )?;

    Ok(HttpResponse::Created().json(image.to_info()))
}

pub async fn get_image(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let image: Image = conn.query_row(
        &format!("SELECT {} FROM images WHERE id = ?1 AND deleted_at IS NULL", IMG_COLS),
        params![image_id],
        row_to_image,
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    if image.owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    Ok(HttpResponse::Ok().json(image.to_info()))
}

pub async fn download_image(
    db: web::Data<Database>,
    config: web::Data<Config>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let image: Image = conn.query_row(
        &format!("SELECT {} FROM images WHERE id = ?1 AND deleted_at IS NULL", IMG_COLS),
        params![image_id],
        row_to_image,
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    if image.owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    let storage = StorageService::new(&config.storage_path);
    let data = storage.read_file(image.owner_id, &image.filename)?;

    Ok(HttpResponse::Ok()
        .content_type(image.mime_type.clone())
        .insert_header(("Content-Disposition", format!("attachment; filename=\"{}\"", image.original)))
        .body(data))
}

pub async fn delete_image(
    db: web::Data<Database>,
    _config: web::Data<Config>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let owner_id: i64 = conn.query_row(
        "SELECT owner_id FROM images WHERE id = ?1 AND deleted_at IS NULL",
        params![image_id],
        |row| row.get(0),
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    if owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    conn.execute(
        "UPDATE images SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?1",
        params![image_id],
    )?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "deleted": true })))
}

pub async fn restore_image(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let owner_id: i64 = conn.query_row(
        "SELECT owner_id FROM images WHERE id = ?1 AND deleted_at IS NOT NULL",
        params![image_id],
        |row| row.get(0),
    ).map_err(|_| AppError::NotFound("Image not found in trash".into()))?;

    if owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    conn.execute(
        "UPDATE images SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
        params![image_id],
    )?;

    let image: Image = conn.query_row(
        &format!("SELECT {} FROM images WHERE id = ?1", IMG_COLS),
        params![image_id],
        row_to_image,
    )?;

    Ok(HttpResponse::Ok().json(image.to_info()))
}

pub async fn permanent_delete(
    db: web::Data<Database>,
    config: web::Data<Config>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let image: Image = conn.query_row(
        &format!("SELECT {} FROM images WHERE id = ?1 AND deleted_at IS NOT NULL", IMG_COLS),
        params![image_id],
        row_to_image,
    ).map_err(|_| AppError::NotFound("Image not found in trash".into()))?;

    if image.owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    let storage = StorageService::new(&config.storage_path);
    storage.delete_file(image.owner_id, &image.filename)?;

    let user_dir = storage.get_user_path(image.owner_id);
    let stem = std::path::Path::new(&image.filename)
        .file_stem().and_then(|s| s.to_str()).unwrap_or("");
    let ext = std::path::Path::new(&image.filename)
        .extension().and_then(|s| s.to_str()).unwrap_or("jpg");
    let thumb_path = format!("{}/{}_thumb.{}", user_dir, stem, ext);
    let _ = std::fs::remove_file(&thumb_path);

    conn.execute("DELETE FROM share_links WHERE image_id = ?1", params![image_id])?;
    conn.execute("DELETE FROM images WHERE id = ?1", params![image_id])?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "deleted": true })))
}

pub async fn empty_trash(
    db: web::Data<Database>,
    config: web::Data<Config>,
    user: AuthUser,
) -> Result<HttpResponse, AppError> {
    let conn = db.conn.lock().unwrap();
    let storage = StorageService::new(&config.storage_path);

    let sql = format!("SELECT {} FROM images WHERE owner_id = ?1 AND deleted_at IS NOT NULL", IMG_COLS);
    let mut stmt = conn.prepare(&sql)?;
    let images: Vec<Image> = stmt.query_map(params![user.user_id], row_to_image)?
        .filter_map(|r| r.ok())
        .collect();
    drop(stmt);

    for img in &images {
        storage.delete_file(img.owner_id, &img.filename)?;
        let user_dir = storage.get_user_path(img.owner_id);
        let stem = std::path::Path::new(&img.filename)
            .file_stem().and_then(|s| s.to_str()).unwrap_or("");
        let ext = std::path::Path::new(&img.filename)
            .extension().and_then(|s| s.to_str()).unwrap_or("jpg");
        let thumb_path = format!("{}/{}_thumb.{}", user_dir, stem, ext);
        let _ = std::fs::remove_file(&thumb_path);
    }

    let ids: Vec<i64> = images.iter().map(|i| i.id).collect();
    for id in &ids {
        conn.execute("DELETE FROM share_links WHERE image_id = ?1", params![id])?;
    }

    conn.execute(
        "DELETE FROM images WHERE owner_id = ?1 AND deleted_at IS NOT NULL",
        params![user.user_id],
    )?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "deleted": images.len() })))
}

pub async fn update_image(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
    body: web::Json<UpdateImageRequest>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let mut image: Image = conn.query_row(
        &format!("SELECT {} FROM images WHERE id = ?1 AND deleted_at IS NULL", IMG_COLS),
        params![image_id],
        row_to_image,
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    if image.owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    if let Some(ref new_name) = body.original {
        let storage = StorageService::new(&crate::config::Config::from_env().storage_path);
        let ext = std::path::Path::new(new_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        let current_ext = std::path::Path::new(&image.original)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");

        let new_filename = if ext != current_ext {
            StorageService::generate_filename(new_name)
        } else {
            image.filename.clone()
        };

        if new_filename != image.filename {
            storage.rename_file(image.owner_id, &image.filename, &new_filename)?;
            image.filename = new_filename;
        }
        image.original = new_name.clone();
    }

    if let Some(fid) = body.folder_id {
        image.folder_id = Some(fid);
    }

    if let Some(ref tags) = body.tags {
        image.tags = tags.clone();
    }

    conn.execute(
        "UPDATE images SET original = ?1, folder_id = ?2, tags = ?3, updated_at = CURRENT_TIMESTAMP WHERE id = ?4",
        params![image.original, image.folder_id, image.tags, image_id],
    )?;

    Ok(HttpResponse::Ok().json(image.to_info()))
}

pub async fn toggle_favorite(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
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

    conn.execute(
        "UPDATE images SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
        params![image_id],
    )?;

    let image: Image = conn.query_row(
        &format!("SELECT {} FROM images WHERE id = ?1", IMG_COLS),
        params![image_id],
        row_to_image,
    )?;

    Ok(HttpResponse::Ok().json(image.to_info()))
}

pub async fn move_image(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
    body: web::Json<MoveImageRequest>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let owner_id: i64 = conn.query_row(
        "SELECT owner_id FROM images WHERE id = ?1 AND deleted_at IS NULL",
        params![image_id],
        |row| row.get(0),
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    if owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    conn.execute(
        "UPDATE images SET folder_id = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        params![body.folder_id, image_id],
    )?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "moved": true })))
}