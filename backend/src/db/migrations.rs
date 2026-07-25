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
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_images_owner ON images(owner_id);
        CREATE INDEX IF NOT EXISTS idx_images_folder ON images(folder_id);
        CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
        CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_id);"
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
