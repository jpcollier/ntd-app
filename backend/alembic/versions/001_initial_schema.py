"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create modes table (reference data)
    op.create_table(
        'modes',
        sa.Column('code', sa.String(10), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('category', sa.String(20), nullable=False),
    )

    # Create agencies table
    op.create_table(
        'agencies',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('ntd_id', sa.String(10), unique=True, nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('state', sa.String(2), nullable=True, index=True),
        sa.Column('uza_name', sa.String(255), nullable=True),
        sa.Column('reporter_type', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Create ridership_facts table
    op.create_table(
        'ridership_facts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('agency_id', sa.Integer(), sa.ForeignKey('agencies.id'), nullable=False, index=True),
        sa.Column('mode_code', sa.String(10), sa.ForeignKey('modes.code'), nullable=False, index=True),
        sa.Column('type_of_service', sa.String(10), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False, index=True),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('upt', sa.BigInteger(), nullable=True),
        sa.Column('vrm', sa.BigInteger(), nullable=True),
        sa.Column('vrh', sa.BigInteger(), nullable=True),
        sa.Column('voms', sa.Integer(), nullable=True),
        sa.Column('is_estimated', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Create composite index for common queries
    op.create_index(
        'ix_ridership_facts_agency_mode_date',
        'ridership_facts',
        ['agency_id', 'mode_code', 'year', 'month'],
    )


def downgrade() -> None:
    op.drop_index('ix_ridership_facts_agency_mode_date', 'ridership_facts')
    op.drop_table('ridership_facts')
    op.drop_table('agencies')
    op.drop_table('modes')
