from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class RidershipFactBase(SQLModel):
    agency_id: int = Field(foreign_key="agencies.id", index=True)
    mode_code: str = Field(foreign_key="modes.code", index=True, max_length=10)
    type_of_service: str = Field(max_length=10)  # DO (Directly Operated), PT (Purchased Transportation)
    year: int = Field(index=True)
    month: int = Field(ge=1, le=12)
    upt: Optional[int] = Field(default=None)  # Unlinked Passenger Trips
    vrm: Optional[int] = Field(default=None)  # Vehicle Revenue Miles
    vrh: Optional[int] = Field(default=None)  # Vehicle Revenue Hours
    voms: Optional[int] = Field(default=None)  # Vehicles Operated in Max Service
    is_estimated: bool = Field(default=False)


class RidershipFact(RidershipFactBase, table=True):
    __tablename__ = "ridership_facts"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RidershipFactRead(RidershipFactBase):
    id: int
    created_at: datetime


class RidershipQuery(SQLModel):
    agency_ids: Optional[list[int]] = None
    ntd_ids: Optional[list[str]] = None
    mode_codes: Optional[list[str]] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    start_month: Optional[int] = None
    end_month: Optional[int] = None
    metrics: Optional[list[str]] = None  # upt, vrm, vrh, voms
    page: int = 1
    per_page: int = 100


class TimeSeriesPoint(SQLModel):
    year: int
    month: int
    value: Optional[int] = None


class TimeSeriesData(SQLModel):
    agency_name: str
    ntd_id: str
    mode_code: str
    metric: str
    data: list[TimeSeriesPoint]



class RidershipList(SQLModel):
    items: list[RidershipFactRead]
    total: int
    page: int
    per_page: int
    pages: int
