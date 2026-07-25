use actix_web::{web, HttpResponse};
use rusqlite::params;

use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::folder::*;

pub async fn list_folders(
    db: web::Data<Database>,
    user: AuthUser,
) -> Result<HttpResponse, AppError> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, name, parent_id, owner_id, created_at FROM folders WHERE owner_id = ?1 ORDER BY name"
    )?;

    let folders: Vec<Folder> = stmt.query_map(params![user.user_id], |row| {
        Ok(Folder {
            id: row.get(0)?,
            name: row.get(1)?,
            parent_id: row.get(2)?,
            owner_id: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?.filter_map(|r| r.ok()).collect();

    let tree = build_tree(&folders, None);
    Ok(HttpResponse::Ok().json(tree))
}

pub async fn create_folder(
    db: web::Data<Database>,
    user: AuthUser,
    body: web::Json<CreateFolderRequest>,
) -> Result<HttpResponse, AppError> {
    if body.name.is_empty() {
        return Err(AppError::BadRequest("Folder name cannot be empty".into()));
    }

    let conn = db.conn.lock().unwrap();

    let result = conn.execute(
        "INSERT INTO folders (name, parent_id, owner_id) VALUES (?1, ?2, ?3)",
        params![body.name, body.parent_id, user.user_id],
    );

    match result {
        Ok(_) => {
            let folder_id = conn.last_insert_rowid();
            let folder = Folder {
                id: folder_id,
                name: body.name.clone(),
                parent_id: body.parent_id,
                owner_id: user.user_id,
                created_at: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            };
            Ok(HttpResponse::Created().json(folder))
        }
        Err(rusqlite::Error::SqliteFailure(e, _)) if e.code == rusqlite::ErrorCode::ConstraintViolation => {
            Err(AppError::Conflict("Folder with this name already exists in this location".into()))
        }
        Err(e) => Err(AppError::Internal(e.to_string())),
    }
}

pub async fn get_folder(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let folder_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let folder: Folder = conn.query_row(
        "SELECT id, name, parent_id, owner_id, created_at FROM folders WHERE id = ?1 AND owner_id = ?2",
        params![folder_id, user.user_id],
        |row| Ok(Folder {
            id: row.get(0)?,
            name: row.get(1)?,
            parent_id: row.get(2)?,
            owner_id: row.get(3)?,
            created_at: row.get(4)?,
        }),
    ).map_err(|_| AppError::NotFound("Folder not found".into()))?;

    Ok(HttpResponse::Ok().json(folder))
}

pub async fn update_folder(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
    body: web::Json<UpdateFolderRequest>,
) -> Result<HttpResponse, AppError> {
    let folder_id = path.into_inner();

    if body.name.is_empty() {
        return Err(AppError::BadRequest("Folder name cannot be empty".into()));
    }

    let conn = db.conn.lock().unwrap();

    let rows = conn.execute(
        "UPDATE folders SET name = ?1 WHERE id = ?2 AND owner_id = ?3",
        params![body.name, folder_id, user.user_id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound("Folder not found".into()));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({ "updated": true })))
}

pub async fn delete_folder(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let folder_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let rows = conn.execute(
        "DELETE FROM folders WHERE id = ?1 AND owner_id = ?2",
        params![folder_id, user.user_id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound("Folder not found".into()));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({ "deleted": true })))
}

fn build_tree(folders: &[Folder], parent_id: Option<i64>) -> Vec<FolderTree> {
    folders
        .iter()
        .filter(|f| f.parent_id == parent_id)
        .map(|f| FolderTree {
            id: f.id,
            name: f.name.clone(),
            parent_id: f.parent_id,
            children: build_tree(folders, Some(f.id)),
        })
        .collect()
}
