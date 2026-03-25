from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, and_
from typing import Optional
import csv
import io
from app.database import get_session
from app.models.agency import Agency
from app.models.ridership import RidershipFact
from app.models.mode import Mode

router = APIRouter()

EXPORT_ROW_LIMIT = 100_000


def build_ridership_query(
    session: Session,
    ntd_ids: Optional[str],
    mode_codes: Optional[str],
    start_year: Optional[int],
    end_year: Optional[int],
):
    """Build the ridership query with filters."""
    query = (
        select(
            Agency.ntd_id,
            Agency.name,
            Agency.state,
            RidershipFact.mode_code,
            RidershipFact.type_of_service,
            RidershipFact.year,
            RidershipFact.month,
            RidershipFact.upt,
            RidershipFact.vrm,
            RidershipFact.vrh,
            RidershipFact.voms,
            RidershipFact.is_estimated,
        )
        .join(Agency, Agency.id == RidershipFact.agency_id)
    )

    filters = []

    if ntd_ids:
        ntd_id_list = [n.strip() for n in ntd_ids.split(",")]
        filters.append(Agency.ntd_id.in_(ntd_id_list))

    if mode_codes:
        mode_list = [m.strip().upper() for m in mode_codes.split(",")]
        filters.append(RidershipFact.mode_code.in_(mode_list))

    if start_year:
        filters.append(RidershipFact.year >= start_year)

    if end_year:
        filters.append(RidershipFact.year <= end_year)

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(Agency.ntd_id, RidershipFact.mode_code, RidershipFact.year, RidershipFact.month)
    return query


@router.get("/csv")
def export_csv(
    ntd_ids: Optional[str] = Query(None, description="Comma-separated NTD IDs"),
    mode_codes: Optional[str] = Query(None, description="Comma-separated mode codes"),
    start_year: Optional[int] = Query(None, ge=2002),
    end_year: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    """Export filtered ridership data as CSV."""
    query = build_ridership_query(session, ntd_ids, mode_codes, start_year, end_year)
    results = session.exec(query).all()
    truncated = len(results) > EXPORT_ROW_LIMIT
    if truncated:
        results = results[:EXPORT_ROW_LIMIT]

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "NTD ID", "Agency Name", "State", "Mode", "Type of Service",
        "Year", "Month", "UPT", "VRM", "VRH", "VOMS", "Is Estimated"
    ])

    # Data rows
    for row in results:
        writer.writerow([
            row[0], row[1], row[2], row[3], row[4],
            row[5], row[6], row[7], row[8], row[9], row[10], row[11]
        ])

    output.seek(0)

    headers = {"Content-Disposition": "attachment; filename=ridership_export.csv"}
    if truncated:
        headers["X-Export-Truncated"] = "true"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers=headers,
    )


@router.get("/excel")
def export_excel(
    ntd_ids: Optional[str] = Query(None, description="Comma-separated NTD IDs"),
    mode_codes: Optional[str] = Query(None, description="Comma-separated mode codes"),
    start_year: Optional[int] = Query(None, ge=2002),
    end_year: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    """Export filtered ridership data as Excel."""
    import xlsxwriter

    query = build_ridership_query(session, ntd_ids, mode_codes, start_year, end_year)
    results = session.exec(query).all()
    truncated = len(results) > EXPORT_ROW_LIMIT
    if truncated:
        results = results[:EXPORT_ROW_LIMIT]

    # Create Excel in memory
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {"in_memory": True})
    worksheet = workbook.add_worksheet("Ridership Data")

    # Header format
    header_format = workbook.add_format({"bold": True, "bg_color": "#4472C4", "font_color": "white"})

    # Headers
    headers = [
        "NTD ID", "Agency Name", "State", "Mode", "Type of Service",
        "Year", "Month", "UPT", "VRM", "VRH", "VOMS", "Is Estimated"
    ]
    for col, header in enumerate(headers):
        worksheet.write(0, col, header, header_format)

    # Data rows
    for row_idx, row in enumerate(results, start=1):
        for col_idx, value in enumerate(row):
            worksheet.write(row_idx, col_idx, value)

    # Auto-fit columns
    worksheet.set_column(0, 0, 10)   # NTD ID
    worksheet.set_column(1, 1, 40)   # Agency Name
    worksheet.set_column(2, 2, 8)    # State
    worksheet.set_column(3, 3, 8)    # Mode
    worksheet.set_column(4, 4, 15)   # TOS
    worksheet.set_column(5, 6, 8)    # Year, Month
    worksheet.set_column(7, 10, 12)  # Metrics

    workbook.close()
    output.seek(0)

    resp_headers = {"Content-Disposition": "attachment; filename=ridership_export.xlsx"}
    if truncated:
        resp_headers["X-Export-Truncated"] = "true"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=resp_headers,
    )
