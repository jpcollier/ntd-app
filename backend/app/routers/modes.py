from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from typing import Optional
from app.database import get_session
from app.models.mode import Mode, ModeRead
from app.models.agency import Agency
from app.models.ridership import RidershipFact

router = APIRouter()


@router.get("", response_model=list[ModeRead])
def list_modes(
    category: Optional[str] = None,
    ntd_id: Optional[str] = Query(None, description="Filter to modes with data for this agency"),
    session: Session = Depends(get_session),
):
    """List all transit modes, optionally filtered by category or by agency NTD ID."""
    query = select(Mode)

    if category:
        query = query.where(Mode.category == category)

    if ntd_id:
        agency = session.exec(select(Agency).where(Agency.ntd_id == ntd_id)).first()
        if agency:
            used_codes = select(func.distinct(RidershipFact.mode_code)).where(
                RidershipFact.agency_id == agency.id
            )
            query = query.where(Mode.code.in_(used_codes))

    query = query.order_by(Mode.category, Mode.name)
    return session.exec(query).all()
