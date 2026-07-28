use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SetTagsRequest {
    pub tags: Vec<String>,
}
