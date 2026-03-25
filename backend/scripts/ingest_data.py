"""
FTA Excel Data Ingestion Script

Reads FTA Monthly Ridership Excel files and loads data into PostgreSQL.

Usage:
    python -m scripts.ingest_data --file "/data/raw/January 2026 Complete Monthly Ridership....xlsx"
"""

import argparse
import sys
import os
import re
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from sqlmodel import Session, select
from app.database import engine
from app.models.agency import Agency
from app.models.ridership import RidershipFact
from app.models.mode import Mode


def normalize_ntd_id(raw) -> str | None:
    """Normalize NTD ID to a plain integer string (e.g. 1.0 -> '1')."""
    s = str(raw).strip()
    if not s or s == 'nan':
        return None
    try:
        return str(int(float(s)))
    except (ValueError, TypeError):
        return None


def parse_month_column(col_name: str) -> tuple[int, int] | None:
    """Parse column name like '1/2002' to (month, year)."""
    match = re.match(r'^(\d{1,2})/(\d{4})$', str(col_name))
    if match:
        return int(match.group(1)), int(match.group(2))
    return None


def get_month_columns(df: pd.DataFrame) -> list[str]:
    """Get all month/year columns from dataframe."""
    month_cols = []
    for col in df.columns:
        if parse_month_column(col):
            month_cols.append(col)
    return month_cols


def ingest_agencies(session: Session, df: pd.DataFrame) -> dict[str, int]:
    """Ingest unique agencies and return mapping of ntd_id -> agency_id."""
    agency_map = {}

    # Get unique agencies by NTD ID
    unique_agencies = df.drop_duplicates(subset=['NTD ID'])

    for _, row in unique_agencies.iterrows():
        ntd_id = normalize_ntd_id(row['NTD ID'])
        if not ntd_id:
            continue

        # Check if agency exists
        existing = session.exec(
            select(Agency).where(Agency.ntd_id == ntd_id)
        ).first()

        if existing:
            agency_map[ntd_id] = existing.id
        else:
            agency = Agency(
                ntd_id=ntd_id,
                name=str(row.get('Agency', '')).strip(),
                city=str(row.get('HQ City', '')).strip() if pd.notna(row.get('HQ City')) else None,
                state=str(row.get('HQ State', '')).strip() if pd.notna(row.get('HQ State')) else None,
                uza_name=str(row.get('UZA Name', '')).strip() if pd.notna(row.get('UZA Name')) else None,
                reporter_type=str(row.get('Reporter Type', '')).strip() if pd.notna(row.get('Reporter Type')) else None,
            )
            session.add(agency)
            session.flush()
            agency_map[ntd_id] = agency.id

    session.commit()
    print(f"Ingested {len(agency_map)} agencies")
    return agency_map


FactKey = tuple  # (agency_id, mode_code, tos, year, month, is_estimated)


def collect_metric_sheet(
    df: pd.DataFrame,
    metric_name: str,
    agency_map: dict[str, int],
    valid_modes: set[str],
    facts: dict,
    is_estimated: bool = False,
) -> int:
    """Read one metric sheet and merge values into the shared facts dict."""
    month_cols = get_month_columns(df)
    values_collected = 0

    for _, row in df.iterrows():
        ntd_id = normalize_ntd_id(row.get('NTD ID', ''))
        if not ntd_id or ntd_id not in agency_map:
            continue

        agency_id = agency_map[ntd_id]
        mode_code = str(row.get('Mode', '')).strip().upper()
        tos = str(row.get('TOS', '')).strip()

        if mode_code not in valid_modes:
            continue

        for col in month_cols:
            parsed = parse_month_column(col)
            if not parsed:
                continue

            month, year = parsed
            value = row.get(col)

            if pd.isna(value) or value == '':
                continue

            try:
                value_int = int(float(value))
            except (ValueError, TypeError):
                continue

            key: FactKey = (agency_id, mode_code, tos, year, month, is_estimated)
            if key not in facts:
                facts[key] = {}
            facts[key][metric_name.lower()] = value_int
            values_collected += 1

    return values_collected


def flush_facts(session: Session, facts: dict) -> int:
    """Insert all collected facts into the database."""
    batch = []
    batch_size = 5000
    records_created = 0

    for (agency_id, mode_code, tos, year, month, is_estimated), metrics in facts.items():
        fact = RidershipFact(
            agency_id=agency_id,
            mode_code=mode_code,
            type_of_service=tos,
            year=year,
            month=month,
            is_estimated=is_estimated,
            **metrics,
        )
        batch.append(fact)
        records_created += 1

        if len(batch) >= batch_size:
            session.bulk_save_objects(batch)
            session.commit()
            batch = []

    if batch:
        session.bulk_save_objects(batch)
        session.commit()

    return records_created


def collect_estimate_sheet(
    df: pd.DataFrame,
    metric_name: str,
    agency_map: dict[str, int],
    valid_modes: set[str],
    facts: dict,
) -> int:
    """Read a long-format estimate sheet and merge values into the shared facts dict."""
    value_col = None
    for col in df.columns:
        if 'estimated' in str(col).lower():
            value_col = col
            break

    if value_col is None:
        print(f"  Could not find value column in estimate sheet")
        return 0

    values_collected = 0

    for _, row in df.iterrows():
        ntd_id = normalize_ntd_id(row.get('NTD ID', ''))
        if not ntd_id or ntd_id not in agency_map:
            continue

        mode_code = str(row.get('Mode', '')).strip().upper()
        if mode_code not in valid_modes:
            continue

        tos = str(row.get('TOS', '')).strip()
        month_raw = row.get('Month')
        year = row.get('Year')
        value = row.get(value_col)

        if pd.isna(month_raw) or pd.isna(year) or pd.isna(value):
            continue

        try:
            value_int = int(float(value))
            year_int = int(float(year))
            parsed = parse_month_column(str(month_raw).strip())
            month_int = parsed[0] if parsed else int(float(month_raw))
        except (ValueError, TypeError):
            continue

        key: FactKey = (agency_map[ntd_id], mode_code, tos, year_int, month_int, True)
        if key not in facts:
            facts[key] = {}
        facts[key][metric_name.lower()] = value_int
        values_collected += 1

    return values_collected


def merge_metrics(session: Session):
    """
    Merge multiple metric rows into single records.
    This handles cases where each metric comes from a separate sheet.
    """
    # For simplicity in the initial load, we'll just use the data as-is
    # A more sophisticated approach would merge UPT, VRM, VRH, VOMS into single rows
    pass


def ingest_excel_file(file_path: str):
    """Main ingestion function for FTA Excel file."""
    print(f"Reading Excel file: {file_path}")

    # Read all relevant sheets
    excel_file = pd.ExcelFile(file_path)
    sheet_names = excel_file.sheet_names
    print(f"Found sheets: {sheet_names}")

    # Read Master sheet for agencies
    master_df = None
    for sheet in ['Master', 'master', 'MASTER']:
        if sheet in sheet_names:
            master_df = pd.read_excel(excel_file, sheet_name=sheet)
            break

    if master_df is None:
        # Fall back to UPT sheet for agency data
        master_df = pd.read_excel(excel_file, sheet_name='UPT')

    with Session(engine) as session:
        # Get valid mode codes
        modes = session.exec(select(Mode)).all()
        valid_modes = {m.code for m in modes}
        print(f"Valid modes: {valid_modes}")

        # Ingest agencies
        agency_map = ingest_agencies(session, master_df)

        # Define metric sheets
        metric_sheets = {
            'UPT': 'upt',
            'VRM': 'vrm',
            'VRH': 'vrh',
            'VOMS': 'voms',
        }

        estimate_sheets = {
            'UPT Estimates': 'upt',
            'VRM Estimates': 'vrm',
        }

        # Collect all metrics into a shared dict keyed by (agency_id, mode, tos, year, month, is_estimated)
        # This ensures one merged row per combination rather than separate rows per metric sheet.
        facts: dict = {}

        for sheet_name, metric_name in metric_sheets.items():
            if sheet_name in sheet_names:
                print(f"Collecting {sheet_name} sheet...")
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                count = collect_metric_sheet(df, metric_name, agency_map, valid_modes, facts, is_estimated=False)
                print(f"  Collected {count} {metric_name} values")

        estimate_facts: dict = {}
        for sheet_name, metric_name in estimate_sheets.items():
            if sheet_name in sheet_names:
                print(f"Collecting {sheet_name} sheet (estimates)...")
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                count = collect_estimate_sheet(df, metric_name, agency_map, valid_modes, estimate_facts)
                print(f"  Collected {count} estimated {metric_name} values")

        print(f"Flushing {len(facts)} merged records and {len(estimate_facts)} estimate records...")
        total_records = flush_facts(session, facts) + flush_facts(session, estimate_facts)
        print(f"\nTotal records created: {total_records}")


def main():
    parser = argparse.ArgumentParser(description="Ingest FTA ridership Excel data")
    parser.add_argument("--file", required=True, help="Path to Excel file")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        sys.exit(1)

    ingest_excel_file(args.file)


if __name__ == "__main__":
    main()
