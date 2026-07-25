use actix_web::{web, HttpResponse};
use rusqlite::params;

use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::user::*;

pub async fn list_users(
    db: web::Data<Database>,
    user: AuthUser,
) -> Result<HttpResponse, AppError> {
    if !user.is_admin() {
        return Err(AppError::Forbidden("Admin only".into()));
    }

    let conn = db.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC"
    )?;

    let users: Vec<serde_json::Value> = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i64>(0)?,
            "username": row.get::<_, String>(1)?,
            "email": row.get::<_, String>(2)?,
            "role": row.get::<_, String>(3)?,
            "created_at": row.get::<_, String>(4)?
        }))
    })?.filter_map(|r| r.ok()).collect();

    Ok(HttpResponse::Ok().json(users))
}

pub async fn create_user(
    db: web::Data<Database>,
    user: AuthUser,
    body: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    if !user.is_admin() {
        return Err(AppError::Forbidden("Admin only".into()));
    }

    let hash = bcrypt::hash(&body.password, bcrypt::DEFAULT_COST)?;
    let conn = db.conn.lock().unwrap();

    let result = conn.execute(
        "INSERT INTO users (username, email, password, role) VALUES (?1, ?2, ?3, 'user')",
        params![body.username, body.email, hash],
    );

    match result {
        Ok(_) => {
            let user_id = conn.last_insert_rowid();
            Ok(HttpResponse::Created().json(UserInfo {
                id: user_id,
                username: body.username.clone(),
                email: body.email.clone(),
                role: UserRole::User,
            }))
        }
        Err(rusqlite::Error::SqliteFailure(e, _)) if e.code == rusqlite::ErrorCode::ConstraintViolation => {
            Err(AppError::Conflict("Username or email already exists".into()))
        }
        Err(e) => Err(AppError::Internal(e.to_string())),
    }
}

pub async fn update_user_role(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    if !user.is_admin() {
        return Err(AppError::Forbidden("Admin only".into()));
    }

    let target_id = path.into_inner();
    let role = body.get("role")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("Role is required".into()))?;

    if role != "admin" && role != "user" {
        return Err(AppError::BadRequest("Invalid role".into()));
    }

    let conn = db.conn.lock().unwrap();
    let rows = conn.execute(
        "UPDATE users SET role = ?1 WHERE id = ?2",
        params![role, target_id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound("User not found".into()));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({ "updated": true })))
}

pub async fn delete_user(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    if !user.is_admin() {
        return Err(AppError::Forbidden("Admin only".into()));
    }

    let target_id = path.into_inner();
    if target_id == user.user_id {
        return Err(AppError::BadRequest("Cannot delete yourself".into()));
    }

    let conn = db.conn.lock().unwrap();
    let rows = conn.execute("DELETE FROM users WHERE id = ?1 AND role != 'admin'", params![target_id])?;

    if rows == 0 {
        return Err(AppError::NotFound("User not found or is admin".into()));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({ "deleted": true })))
}

pub async fn get_stats(
    db: web::Data<Database>,
    user: AuthUser,
) -> Result<HttpResponse, AppError> {
    if !user.is_admin() {
        return Err(AppError::Forbidden("Admin only".into()));
    }

    let conn = db.conn.lock().unwrap();

    let user_count: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))?;
    let image_count: i64 = conn.query_row("SELECT COUNT(*) FROM images", [], |row| row.get(0))?;
    let folder_count: i64 = conn.query_row("SELECT COUNT(*) FROM folders", [], |row| row.get(0))?;
    let total_size: i64 = conn.query_row("SELECT COALESCE(SUM(size), 0) FROM images", [], |row| row.get(0))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "users": user_count,
        "images": image_count,
        "folders": folder_count,
        "total_size": total_size
    })))
}
