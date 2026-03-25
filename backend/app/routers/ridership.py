from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, and_, SQLModel
from typing import Optional
from app.database import get_session
from app.models.agency import Agency
from app.models.ridership import (
    RidershipFact,
    RidershipFactRead,
    RidershipList,
    TimeSeriesData,
    TimeSeriesPoint,
)

router = APIRouter()

VALID_METRICS = {"upt", "vrm", "vrh", "voms"}


class TopAgencyResult(SQLModel):
    ntd_id: str
    name: str
    city: Optional[str]
    state: Optional[str]
    total_upt: int
    year: int


@router.get("/top-agencies", response_model=list[TopAgencyResult])
def get_top_agencies(
    year: Optional[int] = Query(None, description="Year to rank by; defaults to most recent"),
    limit: int = Query(10, ge=1, le=25),
    session: Session = Depends(get_session),
):
    """Return top agencies by total UPT for a given year."""
    target_year = year or session.exec(select(func.max(RidershipFact.year))).one()
    query = (
        select(
            Agency.ntd_id,
            Agency.name,
            Agency.city,
            Agency.state,
            func.sum(RidershipFact.upt).label("total_upt"),
        )
        .join(Agency, RidershipFact.agency_id == Agency.id)
        .where(RidershipFact.year == target_year)
        .where(RidershipFact.upt.isnot(None))
        .group_by(Agency.id, Agency.ntd_id, Agency.name, Agency.city, Agency.state)
        .order_by(func.sum(RidershipFact.upt).desc())
        .limit(limit)
    )
    results = session.exec(query).all()
    return [
        TopAgencyResult(ntd_id=r[0], name=r[1], city=r[2], state=r[3], total_upt=r[4], year=target_year)
        for r in results
    ]


@router.get("", response_model=RidershipList)
def query_ridership(
    ntd_ids: Optional[str] = Query(None, description="Comma-separated NTD IDs"),
    mode_codes: Optional[str] = Query(None, description="Comma-separated mode codes"),
    type_of_service: Optional[str] = Query(None, description="DO or PT"),
    start_year: Optional[int] = Query(None, ge=2002),
    end_year: Optional[int] = Query(None),
    start_month: Optional[int] = Query(None, ge=1, le=12),
    end_month: Optional[int] = Query(None, ge=1, le=12),
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=1000),
    session: Session = Depends(get_session),
):
    """Query ridership data with filters."""
    query = select(RidershipFact)

    # Build filters
    filters = []

    if ntd_ids:
        ntd_id_list = [n.strip() for n in ntd_ids.split(",")]
        agency_subquery = select(Agency.id).where(Agency.ntd_id.in_(ntd_id_list))
        filters.append(RidershipFact.agency_id.in_(agency_subquery))

    if mode_codes:
        mode_list = [m.strip().upper() for m in mode_codes.split(",")]
        filters.append(RidershipFact.mode_code.in_(mode_list))

    if type_of_service:
        filters.append(RidershipFact.type_of_service == type_of_service.upper())

    if start_year:
        filters.append(RidershipFact.year >= start_year)

    if end_year:
        filters.append(RidershipFact.year <= end_year)

    if start_month:
        filters.append(RidershipFact.month >= start_month)

    if end_month:
        filters.append(RidershipFact.month <= end_month)

    if filters:
        query = query.where(and_(*filters))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    # Order and paginate
    query = query.order_by(RidershipFact.year, RidershipFact.month)
    query = query.offset((page - 1) * per_page).limit(per_page)
    items = session.exec(query).all()

    pages = (total + per_page - 1) // per_page if total > 0 else 0

    return RidershipList(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.get("/timeseries", response_model=list[TimeSeriesData])
def get_timeseries(
    ntd_id: str = Query(..., description="Single NTD ID"),
    mode_codes: Optional[str] = Query(None, description="Comma-separated mode codes"),
    type_of_service: Optional[str] = Query(None, description="DO or PT"),
    metric: str = Query("upt", description="Metric: upt, vrm, vrh, voms"),
    start_year: Optional[int] = Query(None, ge=2002),
    end_year: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    """Get time series data for a single agency, formatted for charts."""
    if metric not in VALID_METRICS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid metric '{metric}'. Must be one of: {', '.join(sorted(VALID_METRICS))}",
        )

    # Get agency
    agency = session.exec(select(Agency).where(Agency.ntd_id == ntd_id)).first()
    if not agency:
        return []

    # Build query
    query = select(RidershipFact).where(RidershipFact.agency_id == agency.id)

    if mode_codes:
        mode_list = [m.strip().upper() for m in mode_codes.split(",")]
        query = query.where(RidershipFact.mode_code.in_(mode_list))

    if type_of_service:
        query = query.where(RidershipFact.type_of_service == type_of_service.upper())

    if start_year:
        query = query.where(RidershipFact.year >= start_year)

    if end_year:
        query = query.where(RidershipFact.year <= end_year)

    query = query.order_by(RidershipFact.mode_code, RidershipFact.year, RidershipFact.month)
    results = session.exec(query).all()

    # Group by (mode_code, type_of_service)
    series_map: dict[tuple, list[TimeSeriesPoint]] = {}
    for r in results:
        value = getattr(r, metric, None)
        if value is None:
            continue
        key = (r.mode_code, r.type_of_service)
        if key not in series_map:
            series_map[key] = []
        series_map[key].append(TimeSeriesPoint(year=r.year, month=r.month, value=value))

    # Build response
    series = []
    for (mode_code, tos), data in series_map.items():
        series.append(
            TimeSeriesData(
                agency_name=agency.name,
                ntd_id=agency.ntd_id,
                mode_code=f"{mode_code} ({tos})" if len(series_map) > 1 else mode_code,
                metric=metric,
                data=data,
            )
        )

    return series



@router.get("/summary")
def get_summary(session: Session = Depends(get_session)):
    """Get summary statistics for the dashboard."""
    # Total agencies
    total_agencies = session.exec(select(func.count(Agency.id))).one()

    # Total ridership records
    total_records = session.exec(select(func.count(RidershipFact.id))).one()

    # Date range
    min_year = session.exec(select(func.min(RidershipFact.year))).one()
    max_year = session.exec(select(func.max(RidershipFact.year))).one()
    max_month = None
    if max_year:
        max_month = session.exec(
            select(func.max(RidershipFact.month)).where(RidershipFact.year == max_year)
        ).one()

    # Total UPT (latest year)
    if max_year:
        total_upt = session.exec(
            select(func.sum(RidershipFact.upt)).where(RidershipFact.year == max_year)
        ).one()
    else:
        total_upt = 0

    # Modes count
    modes_query = select(func.count(func.distinct(RidershipFact.mode_code)))
    active_modes = session.exec(modes_query).one()

    return {
        "total_agencies": total_agencies,
        "total_records": total_records,
        "date_range": {"min_year": min_year, "max_year": max_year, "max_month": max_month},
        "latest_year_total_upt": total_upt,
        "active_modes": active_modes,
    }
