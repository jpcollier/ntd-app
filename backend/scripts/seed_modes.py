"""Seed the modes reference table with transit mode data."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.database import engine
from app.models.mode import Mode, TRANSIT_MODES


def seed_modes():
    """Insert or update transit modes reference data."""
    with Session(engine) as session:
        for mode_data in TRANSIT_MODES:
            existing = session.exec(
                select(Mode).where(Mode.code == mode_data["code"])
            ).first()

            if existing:
                existing.name = mode_data["name"]
                existing.category = mode_data["category"]
                session.add(existing)
            else:
                mode = Mode(**mode_data)
                session.add(mode)

        session.commit()
        print(f"Seeded {len(TRANSIT_MODES)} transit modes")


if __name__ == "__main__":
    seed_modes()
