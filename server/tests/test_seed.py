import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.models import Base, Document, Version

from app.seed import seed_db


@pytest.fixture
def db_session():
    """Creates a fresh in-memory SQLite database session for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    TestingSessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


def test_seed_db_populates(db_session: Session):
    """Verify seed_db creates default documents, initial v1 versions, and links current_version_id."""
    seed_db(db_session)

    documents = db_session.query(Document).all()
    assert len(documents) > 0, "seed_db should populate at least one document"

    for doc in documents:
        assert doc.title is not None
        assert doc.current_version_id is not None

        # Check versions relationship
        versions = db_session.query(Version).filter_by(document_id=doc.id).all()
        assert len(versions) == 1, f"Document {doc.id} should have exactly one initial version (v1)"

        v1 = versions[0]
        assert v1.version_number == 1
        assert v1.label == "Initial Draft"
        assert len(v1.content) > 0
        assert doc.current_version_id == v1.id


def test_seed_db(db_session: Session):
    """Test seed_db can run multiple times without duplicating data or raising errors."""
    # First seed run
    seed_db(db_session)
    doc_count_first = db_session.query(Document).count()
    ver_count_first = db_session.query(Version).count()

    # Second seed run (simulates server restart / React StrictMode)
    seed_db(db_session)
    doc_count_second = db_session.query(Document).count()
    ver_count_second = db_session.query(Version).count()

    assert doc_count_first == doc_count_second, "Repeated seeding should not add duplicate documents"
    assert ver_count_first == ver_count_second, "Repeated seeding should not add duplicate versions"