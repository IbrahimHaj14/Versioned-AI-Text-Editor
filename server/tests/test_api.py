import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models as models  
from app.db import Base, get_db
from app.__main__ import app     
from app.seed import seed_db


@pytest.fixture
def api_client():
    """Create fresh SQLite database and seed it for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    # Seed the test database
    with TestingSessionLocal() as session:
        seed_db(session)

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# 1. GET /documents/{doc_id}
def test_get_document_success(api_client: TestClient):
    """Verify fetching a document returns metadata and active version HTML content."""
    res = api_client.get("/documents/1")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 1
    assert "title" in data
    assert data["current_version"] is not None
    assert "content" in data["current_version"]


def test_get_document_not_found(api_client: TestClient):
    """Test 404 is returned for non-existent document ID."""
    res = api_client.get("/documents/9999")
    assert res.status_code == 404


# 2. GET /documents/{doc_id}/versions
def test_list_document_versions(api_client: TestClient):
    """Test listing document versions."""
    res = api_client.get("/documents/1/versions")
    assert res.status_code == 200
    versions = res.json()
    assert isinstance(versions, list)
    assert len(versions) >= 1

    # Assert content field is excluded from summary listing
    first = versions[0]
    assert "id" in first
    assert "version_number" in first
    assert "content" not in first


# 3. GET /documents/{doc_id}/versions/{v_id}
def test_get_specific_version(api_client: TestClient):
    """Test fetching a specific version returns full content and metadata."""
    # First get doc to know valid v_id
    doc_res = api_client.get("/documents/1").json()
    v_id = doc_res["current_version"]["id"]

    res = api_client.get(f"/documents/1/versions/{v_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == v_id
    assert "content" in data


def test_get_specific_version_wrong_document_404(api_client: TestClient):
    """Test querying a version ID under the wrong document ID returns 404."""
    res = api_client.get("/documents/1/versions/9999")
    assert res.status_code == 404


# 4. POST /documents/{doc_id}/versions
def test_create_new_version(api_client: TestClient):
    """Test creating a new version increments version_number and updates current_version."""
    payload = {"label": "AI Edit: Simplified Claims"}
    res = api_client.post("/documents/1/versions", json=payload)
    assert res.status_code == 201
    new_version = res.json()
    assert new_version["version_number"] == 2
    assert new_version["label"] == "AI Edit: Simplified Claims"

    # Verify document's active pointer updated to new version
    doc_res = api_client.get("/documents/1").json()
    assert doc_res["current_version_id"] == new_version["id"]


# 5. PATCH /documents/{doc_id}/versions/{v_id}
def test_patch_version_in_place(api_client: TestClient):
    """Test PATCH allows partial updates."""
    doc_res = api_client.get("/documents/1").json()
    v_id = doc_res["current_version"]["id"]

    # Patch only the label
    patch_payload = {"label": "User Manual Edit"}
    res = api_client.patch(f"/documents/1/versions/{v_id}", json=patch_payload)
    assert res.status_code == 200
    updated = res.json()
    assert updated["label"] == "User Manual Edit"


# 6. POST /documents/{doc_id}/current-version
def test_switch_current_version(api_client: TestClient):
    """Test switching active version updates current_version_id on parent document."""
    # Create a second version 
    v2_res = api_client.post(
        "/documents/1/versions", json={"label": "Version 2"}
    ).json()
    v2_id = v2_res["id"]

    # Get v1 ID
    versions = api_client.get("/documents/1/versions").json()
    v1_id = [v["id"] for v in versions if v["version_number"] == 1][0]

    # Switch active version back to v1
    switch_res = api_client.post(
        "/documents/1/current-version", json={"version_id": v1_id}
    )
    assert switch_res.status_code == 200

    # Assert current_version_id on document is now v1_id
    doc_res = api_client.get("/documents/1").json()
    assert doc_res["current_version_id"] == v1_id