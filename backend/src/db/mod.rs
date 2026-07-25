use rusqlite::{Connection, Result};
use std::sync::Mutex;

pub mod migrations;

pub struct Database {
    pub conn: Mutex<Connection>,
    pub path: String,
}

impl Clone for Database {
    fn clone(&self) -> Self {
        Self::new(&self.path).expect("Failed to clone database")
    }
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
        let db = Self {
            conn: Mutex::new(conn),
            path: path.to_string(),
        };
        migrations::run_migrations(&db)?;
        Ok(db)
    }
}
