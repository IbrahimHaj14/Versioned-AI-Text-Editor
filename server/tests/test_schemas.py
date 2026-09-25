from datetime import datetime, timezone
import pytest
from pydantic import ValidationError


from app.schemas import (
    DocumentRead,
    SwitchVersionRequest,
    VersionCreate,
    VersionRead,
    VersionSummary,
    VersionUpdate,
)


def test_version_summary_serialization():
    """Verify VersionSummary serializes metadata without requiring HTML content."""
    data = {
        "id": 1,
        "document_id": 10,
        "version_number": 1,
        "label": "Initial Draft",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    summary = VersionSummary(**data)
    assert summary.id == 1
    assert summary.version_number == 1
    assert summary.label == "Initial Draft"
    
    # Ensure content is not included in the summary model fields
    assert "content" not in VersionSummary.model_fields


def test_version_read_includes_content():
    """Verify VersionRead includes full HTML content alongside metadata."""
    data = {
        "id": 1,
        "document_id": 10,
        "version_number": 1,
        "label": "Initial Draft",
        "content": "<p>Claim 1: A method comprising...</p>",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    version_read = VersionRead(**data)
    assert version_read.id == 1
    assert version_read.content == "<p>Claim 1: A method comprising...</p>"


def test_version_create_defaults():
    """Verify VersionCreate accepts optional label and base_version_id."""
    # create payload defaults (no label, no base version)
    v_create_minimal = VersionCreate()
    assert v_create_minimal.label is None
    assert v_create_minimal.base_version_id is None

    # create payload full 
    v_create_full = VersionCreate(label="AI Edit: Renumber Claims", base_version_id=2)
    assert v_create_full.label == "AI Edit: Renumber Claims"
    assert v_create_full.base_version_id == 2


def test_version_update_partial():
    """Verify VersionUpdate allows updating content and/or label independently."""
    # Content update only 
    v_update_content = VersionUpdate(content="<p>Updated Claim 1</p>")
    assert v_update_content.content == "<p>Updated Claim 1</p>"
    assert v_update_content.label is None

    # Label update only - rename
    v_update_label = VersionUpdate(label="Approved Version")
    assert v_update_label.label == "Approved Version"
    assert v_update_label.content is None


def test_document_read_with_embedded_current_version():
    """Test DocumentRead correctly embeds the current version when provided."""
    now = datetime.now(timezone.utc)
    version_data = {
        "id": 1,
        "document_id": 10,
        "version_number": 1,
        "label": "Initial",
        "content": "<p>Content</p>",
        "created_at": now,
        "updated_at": now,
    }
    doc_data = {
        "id": 10,
        "title": "Patent new",
        "current_version_id": 1,
        "created_at": now,
        "current_version": VersionRead(**version_data),
    }
    
    doc_read = DocumentRead(**doc_data)
    assert doc_read.id == 10
    assert doc_read.title == "Patent new"
    assert doc_read.current_version is not None
    assert doc_read.current_version.content == "<p>Content</p>"


def test_switch_version_request_validation():
    """Test SwitchVersionRequest enforces required version_id parameter."""
    req = SwitchVersionRequest(version_id=5)
    assert req.version_id == 5

    # Should raise validation error when version_id is missing
    with pytest.raises(ValidationError):
        SwitchVersionRequest()