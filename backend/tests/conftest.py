from pathlib import Path
import pytest


@pytest.fixture(autouse=True)
def isolated_sqlite_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    db_file = tmp_path / "subdir" / "test_pm.db"
    monkeypatch.setenv("DATABASE_PATH", str(db_file))
    return db_file

