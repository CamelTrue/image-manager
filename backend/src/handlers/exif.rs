use actix_web::{web, HttpResponse};
use rusqlite::params;

use crate::db::Database;
use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::image::ImageExif;
use crate::models::image::GeotaggedImage;

pub async fn get_exif(
    db: web::Data<Database>,
    user: AuthUser,
    path: web::Path<i64>,
) -> Result<HttpResponse, AppError> {
    let image_id = path.into_inner();
    let conn = db.conn.lock().unwrap();

    let owner_id: i64 = conn.query_row(
        "SELECT owner_id FROM images WHERE id = ?1 AND deleted_at IS NULL",
        params![image_id],
        |row| row.get(0),
    ).map_err(|_| AppError::NotFound("Image not found".into()))?;

    if owner_id != user.user_id && !user.is_admin() {
        return Err(AppError::Forbidden("Not your image".into()));
    }

    let exif = conn.query_row(
        "SELECT image_id, make, model, lens, iso, aperture, shutter_speed, focal_length, gps_lat, gps_lng, date_taken, flash, exposure_program, software FROM image_exif WHERE image_id = ?1",
        params![image_id],
        |row| {
            Ok(ImageExif {
                image_id: row.get(0)?,
                make: row.get(1)?,
                model: row.get(2)?,
                lens: row.get(3)?,
                iso: row.get(4)?,
                aperture: row.get(5)?,
                shutter_speed: row.get(6)?,
                focal_length: row.get(7)?,
                gps_lat: row.get(8)?,
                gps_lng: row.get(9)?,
                date_taken: row.get(10)?,
                flash: row.get(11)?,
                exposure_program: row.get(12)?,
                software: row.get(13)?,
            })
        },
    ).ok();

    Ok(HttpResponse::Ok().json(exif))
}

pub async fn get_geotagged(
    db: web::Data<Database>,
    user: AuthUser,
) -> Result<HttpResponse, AppError> {
    let conn = db.conn.lock().unwrap();

    let images: Vec<GeotaggedImage> = conn
        .prepare(
            "SELECT i.id, i.original, e.gps_lat, e.gps_lng, i.created_at
             FROM images i
             INNER JOIN image_exif e ON i.id = e.image_id
             WHERE i.owner_id = ?1 AND i.deleted_at IS NULL
               AND e.gps_lat IS NOT NULL AND e.gps_lng IS NOT NULL
             ORDER BY i.created_at DESC"
        )?
        .query_map(params![user.user_id], |row| {
            Ok(GeotaggedImage {
                id: row.get(0)?,
                original: row.get(1)?,
                gps_lat: row.get(2)?,
                gps_lng: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();

    Ok(HttpResponse::Ok().json(images))
}
