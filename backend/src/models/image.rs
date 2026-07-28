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
    pub width: i64,
    pub height: i64,
    pub is_favorite: bool,
    pub deleted_at: Option<String>,
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
    pub width: i64,
    pub height: i64,
    pub is_favorite: bool,
    pub deleted_at: Option<String>,
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
            width: self.width,
            height: self.height,
            is_favorite: self.is_favorite,
            deleted_at: self.deleted_at.clone(),
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

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageExif {
    pub image_id: i64,
    pub make: Option<String>,
    pub model: Option<String>,
    pub lens: Option<String>,
    pub iso: Option<i64>,
    pub aperture: Option<f64>,
    pub shutter_speed: Option<String>,
    pub focal_length: Option<f64>,
    pub gps_lat: Option<f64>,
    pub gps_lng: Option<f64>,
    pub date_taken: Option<String>,
    pub flash: Option<i64>,
    pub exposure_program: Option<i64>,
    pub software: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeotaggedImage {
    pub id: i64,
    pub original: String,
    pub gps_lat: f64,
    pub gps_lng: f64,
    pub created_at: String,
}
