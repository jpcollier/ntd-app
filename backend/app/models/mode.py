from sqlmodel import SQLModel, Field
from typing import Optional


class ModeBase(SQLModel):
    code: str = Field(primary_key=True, max_length=10)
    name: str = Field(max_length=100)
    category: str = Field(max_length=20)  # rail, non_rail, other


class Mode(ModeBase, table=True):
    __tablename__ = "modes"


class ModeRead(ModeBase):
    pass


# Reference data for transit modes
TRANSIT_MODES = [
    # Rail modes
    {"code": "HR", "name": "Heavy Rail", "category": "rail"},
    {"code": "LR", "name": "Light Rail", "category": "rail"},
    {"code": "CR", "name": "Commuter Rail", "category": "rail"},
    {"code": "SR", "name": "Streetcar Rail", "category": "rail"},
    {"code": "MG", "name": "Monorail/Automated Guideway", "category": "rail"},
    {"code": "CC", "name": "Cable Car", "category": "rail"},
    {"code": "YR", "name": "Hybrid Rail", "category": "rail"},
    {"code": "IP", "name": "Inclined Plane", "category": "rail"},
    {"code": "AR", "name": "Alaska Railroad", "category": "rail"},

    # Bus modes
    {"code": "MB", "name": "Bus", "category": "non_rail"},
    {"code": "RB", "name": "Bus Rapid Transit", "category": "non_rail"},
    {"code": "CB", "name": "Commuter Bus", "category": "non_rail"},
    {"code": "TB", "name": "Trolleybus", "category": "non_rail"},
    {"code": "PB", "name": "Publico", "category": "non_rail"},

    # Demand response
    {"code": "DR", "name": "Demand Response", "category": "non_rail"},
    {"code": "DT", "name": "Demand Response Taxi", "category": "non_rail"},

    # Ferry
    {"code": "FB", "name": "Ferryboat", "category": "non_rail"},

    # Vanpool
    {"code": "VP", "name": "Vanpool", "category": "non_rail"},

    # Other
    {"code": "TR", "name": "Aerial Tramway", "category": "other"},
    {"code": "OR", "name": "Other Rail", "category": "rail"},
]
