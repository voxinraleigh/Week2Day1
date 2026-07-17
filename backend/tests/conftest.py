import os
import tempfile

import pytest

# Redirect the DB to a throwaway temp dir before any `app.*` module is
# imported, so tests can never touch the real backend/data/app.db.
_TMP_DIR = tempfile.mkdtemp(prefix="heatmap-test-")
os.environ["DATABASE_DIR"] = _TMP_DIR
os.environ["DATABASE_FILENAME"] = "test.db"

from fastapi.testclient import TestClient  # noqa: E402

from app.db import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def hp_client(client):
    client.post("/api/login", json={"username": "HP", "password": "[HP123]"})
    return client
