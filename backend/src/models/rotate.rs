use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct RotateRequest {
    pub degrees: u32,
}
