use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Image {
    pub id: i64,
    pub filename: String,
    pub original: String,
    pub mime_type: String,
    pub size: i64,
    pub folder_id: Option<i64>,
    pub owner_id: i64,
    pub tags: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageInfo {
    pub id: i64,
    pub original: String,
    pub mime_type: String,
    pub size: i64,
    pub folder_id: Option<i64>,
    pub owner_id: i64,
    pub tags: String,
    pub created_at: String,
    pub updated_at: String,
}

impl Image {
    pub fn to_info(&self) -> ImageInfo {
        ImageInfo {
            id: self.id,
            original: self.original.clone(),
            mime_type: self.mime_type.clone(),
            size: self.size,
            folder_id: self.folder_id,
            owner_id: self.owner_id,
            tags: self.tags.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateImageRequest {
    pub original: Option<String>,
    pub folder_id: Option<i64>,
    pub tags: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MoveImageRequest {
    pub folder_id: Option<i64>,
}
