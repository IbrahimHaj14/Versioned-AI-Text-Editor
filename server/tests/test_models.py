import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.models import Base, Document, Version


@pytest.fixture
def db_session():
    """Create a new database session for a test."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    
    TestingSessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


def test_create_document_and_versions(db_session: Session):
    """Test creating a document and its versions, ensuring relationships are set correctly."""
    # Create base document
    doc = Document(title="Patent for new invention")
    db_session.add(doc)
    db_session.flush()

    # Create initial version (v1)
    v1 = Version(
        document_id=doc.id,
        version_number=1,
        label="Initial Draft",
        content="<p>Content for initial draft</p>",
    )
    db_session.add(v1)
    db_session.flush()

    # Link current version back to document
    doc.current_version_id = v1.id
    db_session.commit()

    # Assertions
    fetched_doc = db_session.get(Document, doc.id)
    assert fetched_doc is not None
    assert fetched_doc.title == "Patent for new invention"
    assert fetched_doc.current_version_id == v1.id
    assert len(fetched_doc.versions) == 1
    assert fetched_doc.versions[0].content == "<p>Content for initial draft</p>"
    assert fetched_doc.versions[0].document.id == doc.id  # Tests back_populates


def test_unique_version_number_per_document_constraint(db_session: Session):
    """Test unique constraint on version_number for a given document."""
    doc = Document(title="Autonomous Navigation Patent")
    db_session.add(doc)
    db_session.flush()

    v1_a = Version(document_id=doc.id, version_number=1, content="<p>Version 1 draft A</p>")
    v1_b = Version(document_id=doc.id, version_number=1, content="<p>Version 1 draft B</p>")

    db_session.add(v1_a)
    db_session.commit()

    db_session.add(v1_b)
    with pytest.raises(IntegrityError):
        db_session.commit()
    
    db_session.rollback()


def test_cascade_delete_removes_versions(db_session: Session):
    """Test cascade delete behavior, deleting a document should remove its versions."""
    doc = Document(title="Patent for new AI algorithm")
    db_session.add(doc)
    db_session.flush()

    v1 = Version(document_id=doc.id, version_number=1, content="<p>Content for version 1</p>")
    v2 = Version(document_id=doc.id, version_number=2, content="<p>Content for version 2</p>")
    db_session.add_all([v1, v2])
    db_session.commit()

    # Confirm versions exist
    assert db_session.query(Version).filter_by(document_id=doc.id).count() == 2

    # Delete parent document
    db_session.delete(doc)
    db_session.commit()

    # Confirm versions were deleted automatically
    assert db_session.query(Version).filter_by(document_id=doc.id).count() == 0


def test_update_version_in_place(db_session: Session):
    """Test that updating a version's content and label in place works correctly."""
    doc = Document(title="Patent for new AI algorithm")
    db_session.add(doc)
    db_session.flush()

    v1 = Version(document_id=doc.id, version_number=1, content="<p>Original text</p>")
    db_session.add(v1)
    db_session.commit()

    # Perform in-place mutation
    v1.content = "<p>Edited text in-place</p>"
    v1.label = "Manual Edit"
    db_session.commit()

    versions = db_session.query(Version).filter_by(document_id=doc.id).all()
    assert len(versions) == 1
    assert versions[0].content == "<p>Edited text in-place</p>"
    assert versions[0].label == "Manual Edit"