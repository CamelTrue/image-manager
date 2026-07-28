use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ZipDownloadRequest {
    pub ids: Vec<i64>,
}
