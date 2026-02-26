from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from pathlib import Path
from config import settings
import time

DATABASE_URL = f"postgresql+psycopg2://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"

engine = create_engine(
    DATABASE_URL,
    # echo=True
)

def wait_for_schema():
    print("⏳ Waiting for accounts_user table...")

    while True:
        try:
            with engine.connect() as conn:
                result = conn.execute(
                    text("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables
                            WHERE table_name = 'accounts_user'
                        );
                    """)
                )

                if result.scalar():
                    print("✅ accounts_user exists")
                    return

        except OperationalError:
            pass

        print("Schema not ready yet...")
        time.sleep(2)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# FastAPI dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()