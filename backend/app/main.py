from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from app.config import get_settings
from app.database import get_session
from app.routers import agencies, modes, ridership, export

settings = get_settings()

app = FastAPI(
    title="FTA Ridership Data API",
    description="Public API for exploring FTA Monthly Ridership data",
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Accept", "Content-Type", "Cache-Control"],
)

app.include_router(agencies.router, prefix="/api/v1/agencies", tags=["Agencies"])
app.include_router(modes.router, prefix="/api/v1/modes", tags=["Modes"])
app.include_router(ridership.router, prefix="/api/v1/ridership", tags=["Ridership"])
app.include_router(export.router, prefix="/api/v1/export", tags=["Export"])


@app.get("/api/v1/health")
def health_check(session: Session = Depends(get_session)):
    session.exec(select(1))
    return {"status": "healthy"}


@app.get("/api/v1")
def api_root():
    return {
        "message": "FTA Ridership Data API",
        "version": "1.0.0",
        "docs": "/api/v1/docs",
        "endpoints": {
            "agencies": "/api/v1/agencies",
            "modes": "/api/v1/modes",
            "ridership": "/api/v1/ridership",
            "export": "/api/v1/export",
        },
    }
