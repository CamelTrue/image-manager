use actix_web::{web, HttpResponse};
use rusqlite::params;

use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::tag::SetTagsRequest;

pub async fn list_tags(
    db: web::Data<Database>,
    user: AuthUser,
) -> Result<HttpResponse, AppError> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT DISTINCT tags FROM images WHERE owner_id = ?1 AND tags != '[]' AND tags != ''"
    )?;

    let raw_tags: Vec<String> = stmt.query_map(params![user.user_id], |row| {
        row.get(0)
    })?.filter_map(|r| r.ok()).collect();

    let mut all_tags = std::collections::HashSet::new();
    for raw in &raw_tags {
        if let Ok(parsed) = serde_json::from_str::<Vec<String>>(raw) {
            for tag in parsed {
                if !tag.is_empty() {
                    all_tags.insert(tag);
                }
            }
        }
    }

    let mut tags: Vec<String> = all_tags.into_iter().collect();
    tags.sort();
    Ok(HttpResponse::Ok().json(tags))
}

pub async fn set_tags(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
    body: web::Json<SetTagsRequest>,
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

    let tags_json = serde_json::to_string(&body.tags).unwrap_or_else(|_| "[]".to_string());
    conn.execute(
        "UPDATE images SET tags = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        params![tags_json, image_id],
    )?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "tags": body.tags })))
}
