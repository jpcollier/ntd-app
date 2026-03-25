from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class AgencyBase(SQLModel):
    ntd_id: str = Field(unique=True, index=True, max_length=10)
    name: str = Field(max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=2, index=True)
    uza_name: Optional[str] = Field(default=None, max_length=255)
    reporter_type: Optional[str] = Field(default=None, max_length=50)


class Agency(AgencyBase, table=True):
    __tablename__ = "agencies"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AgencyCreate(AgencyBase):
    pass


class AgencyRead(AgencyBase):
    id: int
    created_at: datetime
    updated_at: datetime


class AgencyList(SQLModel):
    items: list[AgencyRead]
    total: int
    page: int
    per_page: int
    pages: int
