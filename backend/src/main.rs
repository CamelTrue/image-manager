mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;
mod services;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware as actix_mw};
use std::sync::Arc;

use config::Config;
use db::Database;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = Config::from_env();

    println!("Initializing database...");
    let database = Database::new(&config.database_url)
        .expect("Failed to initialize database");

    let storage = services::storage::StorageService::new(&config.storage_path);
    storage.ensure_dir().expect("Failed to create storage directory");

    let host = config.server_host.clone();
    let port = config.server_port;
    let config = Arc::new(config);

    println!("Starting server on {}:{}", host, port);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(actix_mw::Logger::default())
            .app_data(web::Data::from(Arc::clone(&config)))
            .app_data(web::Data::new(database.clone()))
            .app_data(web::PayloadConfig::default().limit(100 * 1024 * 1024))
            // Auth routes
            .route("/api/auth/register", web::post().to(handlers::auth::register))
            .route("/api/auth/login", web::post().to(handlers::auth::login))
            .route("/api/auth/refresh", web::post().to(handlers::auth::refresh))
            // Image routes
            .route("/api/images", web::get().to(handlers::images::list_images))
            .route("/api/images/upload", web::post().to(handlers::images::upload_image))
            .route("/api/images/download-zip", web::post().to(handlers::zip::download_zip))
            .route("/api/images/{id}", web::get().to(handlers::images::get_image))
            .route("/api/images/{id}/download", web::get().to(handlers::images::download_image))
            .route("/api/images/{id}", web::put().to(handlers::images::update_image))
            .route("/api/images/{id}", web::delete().to(handlers::images::delete_image))
            .route("/api/images/{id}/move", web::put().to(handlers::images::move_image))
            .route("/api/images/{id}/thumbnail", web::get().to(handlers::thumbnails::get_thumbnail))
            .route("/api/images/{id}/rotate", web::post().to(handlers::rotate::rotate_image))
            .route("/api/images/{id}/tags", web::put().to(handlers::tags::set_tags))
            .route("/api/images/{id}/share", web::post().to(handlers::share::create_share))
            .route("/api/images/{id}/shares", web::get().to(handlers::share::list_shares))
            // Tag routes
            .route("/api/tags", web::get().to(handlers::tags::list_tags))
            // Share routes
            .route("/api/share/{token}/download", web::get().to(handlers::share::download_share))
            .route("/api/share/{token}", web::get().to(handlers::share::get_share))
            .route("/api/share/{token}", web::delete().to(handlers::share::delete_share))
            // Profile routes
            .route("/api/profile", web::get().to(handlers::profile::get_profile))
            .route("/api/profile", web::put().to(handlers::profile::update_email))
            .route("/api/profile/password", web::put().to(handlers::profile::change_password))
            // Folder routes
            .route("/api/folders", web::get().to(handlers::folders::list_folders))
            .route("/api/folders", web::post().to(handlers::folders::create_folder))
            .route("/api/folders/{id}", web::get().to(handlers::folders::get_folder))
            .route("/api/folders/{id}", web::put().to(handlers::folders::update_folder))
            .route("/api/folders/{id}", web::delete().to(handlers::folders::delete_folder))
            // Admin routes
            .route("/api/admin/users", web::get().to(handlers::admin::list_users))
            .route("/api/admin/users", web::post().to(handlers::admin::create_user))
            .route("/api/admin/users/{id}", web::put().to(handlers::admin::update_user_role))
            .route("/api/admin/users/{id}", web::delete().to(handlers::admin::delete_user))
            .route("/api/admin/stats", web::get().to(handlers::admin::get_stats))
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}
