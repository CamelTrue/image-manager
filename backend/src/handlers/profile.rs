use actix_web::{web, HttpResponse};
use rusqlite::params;

use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::profile::{UpdateEmailRequest, ChangePasswordRequest};

pub async fn get_profile(
    db: web::Data<Database>,
    user: AuthUser,
) -> Result<HttpResponse, AppError> {
    let conn = db.conn.lock().unwrap();

    let profile: (i64, String, String, String) = conn.query_row(
        "SELECT id, username, email, role FROM users WHERE id = ?1",
        params![user.user_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
    ).map_err(|_| AppError::NotFound("User not found".into()))?;

    let image_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM images WHERE owner_id = ?1",
        params![user.user_id],
        |row| row.get(0),
    )?;

    let total_size: i64 = conn.query_row(
        "SELECT COALESCE(SUM(size), 0) FROM images WHERE owner_id = ?1",
        params![user.user_id],
        |row| row.get(0),
    )?;

    let folder_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM folders WHERE owner_id = ?1",
        params![user.user_id],
        |row| row.get(0),
    )?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "id": profile.0,
        "username": profile.1,
        "email": profile.2,
        "role": profile.3,
        "image_count": image_count,
        "total_size": total_size,
        "folder_count": folder_count,
    })))
}

pub async fn update_email(
    db: web::Data<Database>,
    user: AuthUser,
    body: web::Json<UpdateEmailRequest>,
) -> Result<HttpResponse, AppError> {
    if body.email.is_empty() || !body.email.contains('@') {
        return Err(AppError::BadRequest("Valid email required".into()));
    }

    let conn = db.conn.lock().unwrap();
    let rows = conn.execute(
        "UPDATE users SET email = ?1 WHERE id = ?2",
        params![body.email, user.user_id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound("User not found".into()));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({ "updated": true })))
}

pub async fn change_password(
    db: web::Data<Database>,
    user: AuthUser,
    body: web::Json<ChangePasswordRequest>,
) -> Result<HttpResponse, AppError> {
    if body.new_password.len() < 3 {
        return Err(AppError::BadRequest("Password must be at least 3 characters".into()));
    }

    let conn = db.conn.lock().unwrap();
    let current_hash: String = conn.query_row(
        "SELECT password FROM users WHERE id = ?1",
        params![user.user_id],
        |row| row.get(0),
    ).map_err(|_| AppError::NotFound("User not found".into()))?;

    if !bcrypt::verify(&body.current_password, &current_hash)
        .map_err(|e| AppError::Internal(e.to_string()))?
    {
        return Err(AppError::BadRequest("Current password is incorrect".into()));
    }

    let new_hash = bcrypt::hash(&body.new_password, bcrypt::DEFAULT_COST)?;
    conn.execute(
        "UPDATE users SET password = ?1 WHERE id = ?2",
        params![new_hash, user.user_id],
    )?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "updated": true })))
}
