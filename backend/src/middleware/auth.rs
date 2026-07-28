use actix_web::{dev::Payload, web, FromRequest, HttpRequest};
use std::future::{ready, Ready};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};

use crate::config::Config;
use crate::errors::AppError;
use crate::models::user::UserRole;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i64,
    pub username: String,
    pub role: String,
    pub exp: usize,
    pub token_type: String,
}

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: i64,
    pub username: String,
    pub role: UserRole,
}

impl AuthUser {
    pub fn is_admin(&self) -> bool {
        matches!(self.role, UserRole::Admin)
    }
}

impl FromRequest for AuthUser {
    type Error = AppError;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        let config = req.app_data::<web::Data<Config>>().cloned();

        let header_token = req
            .headers()
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "));

        let query_token = req
            .query_string()
            .split('&')
            .filter_map(|pair| {
                let mut parts = pair.splitn(2, '=');
                let key = parts.next()?;
                let val = parts.next()?;
                if key == "token" { Some(val) } else { None }
            })
            .next();

        let token = header_token.or(query_token);

        let result = match (config, token) {
            (Some(config), Some(token)) => {
                match decode::<Claims>(
                    token,
                    &DecodingKey::from_secret(config.jwt_secret.as_bytes()),
                    &Validation::new(Algorithm::HS256),
                ) {
                    Ok(token_data) => {
                        let claims = token_data.claims;
                        if claims.token_type != "access" {
                            Err(AppError::Unauthorized("Invalid token type".into()))
                        } else {
                            Ok(AuthUser {
                                user_id: claims.sub,
                                username: claims.username,
                                role: UserRole::from_str(&claims.role),
                            })
                        }
                    }
                    Err(e) => Err(AppError::Unauthorized(e.to_string())),
                }
            }
            _ => Err(AppError::Unauthorized("Missing token".into())),
        };

        ready(result)
    }
}
