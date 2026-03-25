from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import Optional
from app.database import get_session
from app.models.agency import Agency, AgencyRead, AgencyList

router = APIRouter()


@router.get("", response_model=AgencyList)
def list_agencies(
    state: Optional[str] = Query(None, description="Filter by state code (e.g., CA, NY)"),
    search: Optional[str] = Query(None, description="Search agency name"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=500),
    session: Session = Depends(get_session),
):
    """List all transit agencies with pagination and filtering."""
    query = select(Agency)

    if state:
        query = query.where(Agency.state == state.upper())

    if search:
        query = query.where(Agency.name.ilike(f"%{search}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page)
    agencies = session.exec(query).all()

    pages = (total + per_page - 1) // per_page

    return AgencyList(
        items=agencies,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.get("/states")
def list_states(session: Session = Depends(get_session)):
    """List all unique states with agency counts."""
    query = (
        select(Agency.state, func.count(Agency.id).label("count"))
        .where(Agency.state.isnot(None))
        .group_by(Agency.state)
        .order_by(Agency.state)
    )
    results = session.exec(query).all()
    return [{"state": row[0], "count": row[1]} for row in results]


@router.get("/{ntd_id}", response_model=AgencyRead)
def get_agency(ntd_id: str, session: Session = Depends(get_session)):
    """Get a single agency by NTD ID."""
    query = select(Agency).where(Agency.ntd_id == ntd_id)
    agency = session.exec(query).first()

    if not agency:
        raise HTTPException(status_code=404, detail=f"Agency with NTD ID {ntd_id} not found")

    return agency
