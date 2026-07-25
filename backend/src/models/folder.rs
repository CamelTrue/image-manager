use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Folder {
    pub id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub owner_id: i64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateFolderRequest {
    pub name: String,
    pub parent_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFolderRequest {
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct FolderTree {
    pub id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub children: Vec<FolderTree>,
}
