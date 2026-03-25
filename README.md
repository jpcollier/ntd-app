# FTA Ridership Data Explorer

A web application for exploring Federal Transit Administration (FTA) Monthly Ridership data through charts, tables, and a public API.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Table
- **Backend**: FastAPI, Python 3.12, SQLModel, Alembic
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker Compose

## Quick Start

### 1. Clone and Setup Environment

```bash
cp .env.example .env
```

### 2. Start Services

**Development** (hot-reload enabled via `docker-compose.override.yml`):
```bash
docker compose up -d
```

**Production** (built images, no source mounts):
```bash
docker compose -f docker-compose.yml up -d
```

Both start:
- PostgreSQL on port 5432
- FastAPI backend on port 8000
- Next.js frontend on port 3000

### 3. Initialize Database

```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m scripts.seed_modes
```

### 4. Load FTA Data

Download an FTA Monthly Ridership Excel file from [FTA's website](https://www.transit.dot.gov/ntd/data-product/monthly-module-raw-data-release) and place it in `data/raw/`.

Run the ingestion script:

```bash
docker-compose exec backend python -m scripts.ingest_data \
    --file "/data/raw/January 2026 Complete Monthly Ridership (with adjustments and estimates)_260302.xlsx"
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **API Base URL**: http://localhost:8000/api/v1

## Project Structure

```
ntd-ridership-app/
├── docker-compose.yml
├── .env.example
├── frontend/                # Next.js application
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities and API client
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py         # FastAPI app entry
│   │   ├── models/         # SQLModel database models
│   │   └── routers/        # API endpoints
│   ├── alembic/            # Database migrations
│   └── scripts/            # Data ingestion scripts
└── data/raw/               # FTA Excel files (gitignored)
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/agencies` | List agencies (paginated, filterable) |
| `GET /api/v1/agencies/{ntd_id}` | Get agency by NTD ID |
| `GET /api/v1/agencies/states` | Agency counts by state |
| `GET /api/v1/modes` | List transit modes |
| `GET /api/v1/ridership` | Query ridership data |
| `GET /api/v1/ridership/timeseries` | Time series for charts |
| `GET /api/v1/ridership/summary` | Summary statistics |
| `GET /api/v1/ridership/top-agencies` | Top agencies by UPT |
| `GET /api/v1/export/csv` | Export filtered data as CSV (max 100,000 rows) |
| `GET /api/v1/export/excel` | Export filtered data as Excel (max 100,000 rows) |

## Frontend Pages

- **Home** (`/`): Landing page with stats and agency search
- **Explore Data** (`/explore`): Charts and table view with filters
- **API Builder** (`/api-builder`): Interactive API query builder with code snippets
- **API Docs** (`/api-docs`): Full REST API reference
- **Glossary** (`/glossary`): Metric and terminology definitions

## Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

Create a new migration:
```bash
docker-compose exec backend alembic revision --autogenerate -m "description"
```

Apply migrations:
```bash
docker-compose exec backend alembic upgrade head
```

## Data Model

- **agencies**: Transit agency information (NTD ID, name, location)
- **modes**: Reference table of transit modes (HR, LR, MB, etc.)
- **ridership_facts**: Monthly ridership metrics (UPT, VRM, VRH, VOMS)

## License

MIT
