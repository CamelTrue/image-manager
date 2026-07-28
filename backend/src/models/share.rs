use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ShareLink {
    pub id: i64,
    pub image_id: i64,
    pub token: String,
    pub owner_id: i64,
    pub created_at: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateShareRequest {
    pub expires_in_hours: Option<i64>,
}
