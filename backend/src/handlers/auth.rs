use actix_web::{web, HttpResponse};
use jsonwebtoken::{encode, EncodingKey, Header};
use rusqlite::params;

use crate::config::Config;
use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::Claims;
use crate::models::user::*;

pub async fn register(
    db: web::Data<Database>,
    body: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    if body.username.len() < 3 {
        return Err(AppError::BadRequest("Username must be at least 3 characters".into()));
    }
    if body.password.len() < 6 {
        return Err(AppError::BadRequest("Password must be at least 6 characters".into()));
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

pub async fn login(
    db: web::Data<Database>,
    config: web::Data<Config>,
    body: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    let conn = db.conn.lock().unwrap();

    let user: User = conn.query_row(
        "SELECT id, username, email, password, role, created_at FROM users WHERE username = ?1",
        params![body.username],
        |row| Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            email: row.get(2)?,
            password: row.get(3)?,
            role: UserRole::from_str(&row.get::<_, String>(4)?),
            created_at: row.get(5)?,
        }),
    ).map_err(|_| AppError::Unauthorized("Invalid credentials".into()))?;

    if !bcrypt::verify(&body.password, &user.password)? {
        return Err(AppError::Unauthorized("Invalid credentials".into()));
    }

    let access_token = create_token(&user, &config.jwt_secret, config.jwt_expires_in, "access")?;
    let refresh_token = create_token(&user, &config.jwt_secret, config.refresh_expires_in, "refresh")?;

    Ok(HttpResponse::Ok().json(AuthResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
    }))
}

pub async fn refresh(
    db: web::Data<Database>,
    config: web::Data<Config>,
    body: web::Json<RefreshRequest>,
) -> Result<HttpResponse, AppError> {
    let token_data = jsonwebtoken::decode::<Claims>(
        &body.refresh_token,
        &jsonwebtoken::DecodingKey::from_secret(config.jwt_secret.as_bytes()),
        &jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256),
    )?;

    let claims = token_data.claims;
    if claims.token_type != "refresh" {
        return Err(AppError::Unauthorized("Invalid token type".into()));
    }

    let conn = db.conn.lock().unwrap();
    let user: User = conn.query_row(
        "SELECT id, username, email, password, role, created_at FROM users WHERE id = ?1",
        params![claims.sub],
        |row| Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            email: row.get(2)?,
            password: row.get(3)?,
            role: UserRole::from_str(&row.get::<_, String>(4)?),
            created_at: row.get(5)?,
        }),
    ).map_err(|_| AppError::Unauthorized("User not found".into()))?;

    let access_token = create_token(&user, &config.jwt_secret, config.jwt_expires_in, "access")?;
    let refresh_token = create_token(&user, &config.jwt_secret, config.refresh_expires_in, "refresh")?;

    Ok(HttpResponse::Ok().json(AuthResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
    }))
}

fn create_token(user: &User, secret: &str, expires_in: i64, token_type: &str) -> Result<String, AppError> {
    let exp = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::seconds(expires_in))
        .unwrap()
        .timestamp() as usize;

    let claims = Claims {
        sub: user.id,
        username: user.username.clone(),
        role: user.role.as_str().to_string(),
        exp,
        token_type: token_type.to_string(),
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?;

    Ok(token)
}
