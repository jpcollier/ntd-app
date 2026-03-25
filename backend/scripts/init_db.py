"""Initialize database: run migrations and seed data."""

import subprocess
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    # Run alembic migrations
    print("Running database migrations...")
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    )

    if result.returncode != 0:
        print("Migration failed!")
        sys.exit(1)

    print("Migrations complete.")

    # Seed modes
    print("Seeding transit modes...")
    from scripts.seed_modes import seed_modes
    seed_modes()

    print("Database initialization complete!")


if __name__ == "__main__":
    main()
