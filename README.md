# Image Manager

Gestione immagini self-hosted con interfaccia web moderna. Built con **Rust (Actix-web)** + **React (Vite/TypeScript/Tailwind CSS v4)**.

## Funzionalità

- Upload drag & drop
- Organizzazione in cartelle
- Tag per categorizzare le immagini
- Cartelle private (contenuto nascosto, rivelabile su richiesta)
- Ricerca avanzata (per nome, tag, tipo file, ordinamento)
- Anteprima con slideshow, rotazione, informazioni
- Download singolo / ZIP multipli
- Condivisione via link con scadenza
- Miniature generate automaticamente
- Temi scuro / chiaro
- Profilo utente (statistiche, cambio email/password)
- Pannello admin (statistiche globali)

## Requisiti

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows) oppure Docker Engine + Docker Compose (Linux/Mac)
- Almeno 1 GB di RAM libera

## Installazione

### 1. Clona il repository

```bash
git clone https://github.com/CamelTrue/image-manager.git
cd image-manager
```

### 2. Configura (opzionale)

Crea un file `.env` nella directory principale per personalizzare le impostazioni:

```env
JWT_SECRET=la-tua-chiave-segreta-cambiami
JWT_EXPIRES_IN=900
REFRESH_EXPIRES_IN=604800
```

Se non crei il file, viene usato il valore predefinito `change-me-in-production`. **Cambialo in produzione.**

### 3. Crea le directory per i dati

```bash
mkdir -p data
```

Le immagini vengono salvate in `E:/images` su Windows (modifica il path in `docker-compose.yml` se necessario).  
Il database SQLite viene salvato in `data/`.

### 4. Avvia

```bash
docker compose up --build -d
```

### 5. Accedi

Apri il browser su **http://localhost:3000**

- **Utente:** `admin`
- **Password:** `admin`

## Utilizzo

### Upload
Trascina le immagini nella finestra o clicca sul pulsante `+` nella toolbar.

### Cartelle
- **Crea**: clicca `+` nell'header della sidebar "Cartelle"
- **Sottocartelle**: clicca `+` al passaggio del mouse su una cartella
- **Rinomina**: clicca l'icona matita
- **Elimina**: clicca l'icona cestino
- **Rendi privata**: clicca l'icona lucchetto nel menu hover
- Le cartelle private mostrano il lucchetto; cliccando sulla cartella, il contenuto è nascosto finché non premi "Mostra contenuti"

### Tag
- Aggiungi tag dal pulsante `#` su ogni immagine
- Filtra per tag dal campo "Tag..." nella toolbar

### Ricerca avanzata
Clicca l'icona filtro nella toolbar per ordinare per data/nome/dimensione e filtrare per tipo MIME.

### Selezione multipla
- In vista "Tutte": seleziona le immagini con le checkbox
- Clicca l'icona checkbox nella toolbar per selezionare/deselezionare tutto
- Azioni bulk: Scarica ZIP o Elimina

### Condivisione
Apri un'immagine e usa il pulsante Condividi per generare un link pubblico con scadenza opzionale.

## Comandi utili

```bash
# Avviare in background
docker compose up --build -d

# Fermare
docker compose down

# Vedere i log
docker compose logs -f

# Ricostruire dopo modifiche
docker compose up --build -d
```

## Architettura

```
image-manager/
├── backend/                # Rust + Actix-web
│   ├── src/
│   │   ├── main.rs         # Entry point, routes
│   │   ├── config.rs       # Configurazione da env
│   │   ├── db/             # Database SQLite + migrazioni
│   │   ├── handlers/       # Endpoint API
│   │   ├── middleware/      # Auth JWT
│   │   ├── models/         # Struct dei dati
│   │   └── services/       # Storage su filesystem
│   └── Dockerfile
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── api/            # Chiamate API
│   │   ├── components/     # Componenti UI
│   │   ├── hooks/          # React hooks
│   │   ├── pages/          # Pagine
│   │   ├── store/          # Stato globale (Zustand)
│   │   └── types/          # TypeScript types
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API

Il backend espone API REST su `http://localhost:8080/api/`:
- `/auth` — login, refresh
- `/images` — CRUD, upload, rotazione, tag, thumbnail, ZIP
- `/folders` — CRUD cartelle, toggle privacy
- `/share` — link di condivisione
- `/profile` — profilo utente
- `/admin` — statistiche, gestione utenti

## Licenza

MIT
