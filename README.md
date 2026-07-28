# Image Manager

Self-hosted image management with a modern web interface. Built with **Rust (Actix-web)** + **React (Vite/TypeScript/Tailwind CSS v4)**.

## Features

- Drag & drop upload
- Folder organization
- Tags for categorizing images
- Private folders (content hidden by default, reveal on demand)
- Advanced search (name, tags, MIME type, sorting)
- Preview with slideshow, rotation, metadata
- Single / ZIP batch download
- Share links with optional expiration
- Auto-generated thumbnails
- Dark / Light theme
- User profile (stats, email/password change)
- Admin panel (global stats, user management)

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows) or Docker Engine + Docker Compose (Linux/Mac)
- At least 1 GB free RAM

## Installation

```
┌─────────────────────────────────────────────────────┐
│                  ROADMAP                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. CLONE                                           │
│  ┌─────────────────────────────────┐                │
│  │ git clone ... && cd image-manager│                │
│  └──────────┬──────────────────────┘                │
│             ▼                                       │
│  2. CONFIGURE (optional)                            │
│  ┌─────────────────────────────────┐                │
│  │ Create .env with JWT_SECRET      │                │
│  └──────────┬──────────────────────┘                │
│             ▼                                       │
│  3. PREPARE DATA DIRS                                │
│  ┌─────────────────────────────────┐                │
│  │ mkdir -p data                   │                │
│  │ Check E:/images path in compose │                │
│  └──────────┬──────────────────────┘                │
│             ▼                                       │
│  4. BUILD & START                                   │
│  ┌─────────────────────────────────┐                │
│  │ docker compose up --build -d    │                │
│  └──────────┬──────────────────────┘                │
│             ▼                                       │
│  5. ACCESS                                          │
│  ┌─────────────────────────────────┐                │
│  │ http://localhost:3000           │                │
│  │ admin / admin                   │                │
│  └─────────────────────────────────┘                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 1. Clone
```bash
git clone https://github.com/CamelTrue/image-manager.git
cd image-manager
```

### 2. Configure (optional)
Create a `.env` file in the project root to customize settings:
```env
JWT_SECRET=your-secret-key-change-me
JWT_EXPIRES_IN=900
REFRESH_EXPIRES_IN=604800
```

If you don't create the file, the default value `change-me-in-production` is used. **Change it in production.**

### 3. Create data directories
```bash
mkdir -p data
```

Images are stored at `E:/images` on Windows (edit the path in `docker-compose.yml` if needed).  
The SQLite database is stored in `data/`.

### 4. Start
```bash
docker compose up --build -d
```

### 5. Access
Open your browser at **http://localhost:3000**

- **Username:** `admin`
- **Password:** `admin`

## Usage

### Upload
Drag images into the window or click the `+` button in the toolbar.

### Folders
- **Create**: click `+` in the sidebar "Folders" header
- **Sub-folders**: click `+` on folder hover
- **Rename**: click the edit icon
- **Delete**: click the trash icon
- **Make private**: click the lock icon in the hover menu
- Private folders show a lock icon; clicking such a folder hides its contents until you press "Show contents"

### Tags
- Add tags from the `#` button on each image
- Filter by tag from the "Tags..." field in the toolbar

### Advanced search
Click the filter icon in the toolbar to sort by date/name/size and filter by MIME type.

### Multi-select
- In "All" view: select images using checkboxes
- Click the checkbox icon in the toolbar to select/deselect all
- Bulk actions: Download ZIP or Delete

### Sharing
Open an image and use the Share button to generate a public link with optional expiration date.

## Useful commands

```bash
# Start in background
docker compose up --build -d

# Stop
docker compose down

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up --build -d
```

## Architecture

```
image-manager/
├── backend/                # Rust + Actix-web
│   ├── src/
│   │   ├── main.rs         # Entry point, routes
│   │   ├── config.rs       # Environment-based config
│   │   ├── db/             # SQLite database + migrations
│   │   ├── handlers/       # API endpoints
│   │   ├── middleware/      # JWT auth
│   │   ├── models/         # Data structs
│   │   └── services/       # Filesystem storage
│   └── Dockerfile
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── api/            # API calls
│   │   ├── components/     # UI components
│   │   ├── hooks/          # React hooks
│   │   ├── pages/          # Pages
│   │   ├── store/          # Global state (Zustand)
│   │   └── types/          # TypeScript types
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API

The backend exposes REST APIs at `http://localhost:8080/api/`:
- `/auth` — login, refresh
- `/images` — CRUD, upload, rotate, tags, thumbnail, ZIP
- `/folders` — CRUD folders, toggle privacy
- `/share` — share links
- `/profile` — user profile
- `/admin` — stats, user management

## License

MIT
