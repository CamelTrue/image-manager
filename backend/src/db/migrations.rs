use rusqlite::Result;
use crate::db::Database;

pub fn run_migrations(db: &Database) -> Result<()> {
    let conn = db.conn.lock().unwrap();

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT UNIQUE NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            password    TEXT NOT NULL,
            role        TEXT NOT NULL DEFAULT 'user',
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS folders (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            parent_id   INTEGER REFERENCES folders(id) ON DELETE CASCADE,
            owner_id    INTEGER NOT NULL REFERENCES users(id),
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, parent_id, owner_id)
        );

        CREATE TABLE IF NOT EXISTS images (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            filename    TEXT NOT NULL,
            original    TEXT NOT NULL,
            mime_type   TEXT NOT NULL,
            size        INTEGER NOT NULL,
            folder_id   INTEGER REFERENCES folders(id) ON DELETE SET NULL,
            owner_id    INTEGER NOT NULL REFERENCES users(id),
            tags        TEXT DEFAULT '[]',
            width       INTEGER DEFAULT 0,
            height      INTEGER DEFAULT 0,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS share_links (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            image_id    INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
            token       TEXT UNIQUE NOT NULL,
            owner_id    INTEGER NOT NULL REFERENCES users(id),
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at  DATETIME
        );

        CREATE INDEX IF NOT EXISTS idx_images_owner ON images(owner_id);
        CREATE INDEX IF NOT EXISTS idx_images_folder ON images(folder_id);
        CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
        CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_id);
        CREATE INDEX IF NOT EXISTS idx_share_token ON share_links(token);
        CREATE INDEX IF NOT EXISTS idx_share_image ON share_links(image_id);"
    )?;

    // Add columns if they don't exist (safe for existing DBs)
    let _ = conn.execute_batch("ALTER TABLE images ADD COLUMN width INTEGER DEFAULT 0");
    let _ = conn.execute_batch("ALTER TABLE images ADD COLUMN height INTEGER DEFAULT 0");
    let _ = conn.execute_batch("ALTER TABLE folders ADD COLUMN is_private INTEGER DEFAULT 0");
    let _ = conn.execute_batch("ALTER TABLE images ADD COLUMN is_favorite INTEGER DEFAULT 0");
    let _ = conn.execute_batch("ALTER TABLE images ADD COLUMN deleted_at DATETIME DEFAULT NULL");

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS image_exif (
            image_id        INTEGER PRIMARY KEY REFERENCES images(id) ON DELETE CASCADE,
            make            TEXT,
            model           TEXT,
            lens            TEXT,
            iso             INTEGER,
            aperture        REAL,
            shutter_speed   TEXT,
            focal_length    REAL,
            gps_lat         REAL,
            gps_lng         REAL,
            date_taken      TEXT,
            flash           INTEGER,
            exposure_program INTEGER,
            software        TEXT
        );"
    )?;

    let admin_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM users WHERE role = 'admin'",
        [],
        |row| row.get(0),
    )?;

    if !admin_exists {
        let hash = bcrypt::hash("admin", bcrypt::DEFAULT_COST)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        conn.execute(
            "INSERT INTO users (username, email, password, role) VALUES (?1, ?2, ?3, 'admin')",
            rusqlite::params!["admin", "admin@localhost", hash],
        )?;
    }

    Ok(())
}
