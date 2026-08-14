import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from main import engine


@pytest.fixture(autouse=True)
def clear_tables() -> None:
    with Session(engine) as session:
        session.execute(text("DELETE FROM alert_history"))
        session.execute(text("DELETE FROM sensor_logs"))
        session.commit()
