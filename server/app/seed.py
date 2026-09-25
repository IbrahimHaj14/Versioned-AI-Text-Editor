from sqlalchemy.orm import Session
from app.data import DOCUMENT_1, DOCUMENT_2, DOCUMENT_3
from app.models import Document, Version

SEED_PATENTS = [
    {
        "title": "Patent 1: Wireless Optogenetic Device",
        "content": DOCUMENT_1,
    },
    {
        "title": "Patent 2: Microfluidic Device for Blood Oxygenation",
        "content": DOCUMENT_2,
    },
    {
        "title": "Patent 3: Smart Implantable Drug Delivery Device",
        "content": DOCUMENT_3,
    },
]


def seed_db(db: Session) -> None:
    """Seeds the database with starter patent documents and initial v1 versions.

    Is idempotent: returns early if data is already present.
    """
    existing_doc = db.query(Document).first()
    if existing_doc is not None:
        return

    for data in SEED_PATENTS:
        doc = Document(title=data["title"])
        db.add(doc)
        db.flush()  # Generates doc.id

        v1 = Version(
            document_id=doc.id,
            version_number=1,
            label="Initial Draft",
            content=data["content"],
        )
        db.add(v1)
        db.flush()  # Generates v1.id

        # Set active version pointer on parent document
        doc.current_version_id = v1.id

    db.commit()