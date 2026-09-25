from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

import app.models as models
import app.schemas as schemas
from app.db import Base, SessionLocal, engine, get_db
from app.seed import seed_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create database tables and seed initial data.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_db(db)
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#  GET /documents/{doc_id} -> Fetch document metadata and its current version
@app.get("/documents/{doc_id}", response_model=schemas.DocumentRead)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )
    return doc


# GET /documents/{doc_id}/versions -> List of versions
@app.get(
    "/documents/{doc_id}/versions", response_model=list[schemas.VersionSummary]
)
def list_document_versions(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    versions = (
        db.query(models.Version)
        .filter(models.Version.document_id == doc_id)
        .order_by(models.Version.version_number.asc())
        .all()
    )
    return versions


# GET /documents/{doc_id}/versions/{v_id} -> Fetch specific version content and metadata
@app.get(
    "/documents/{doc_id}/versions/{v_id}", response_model=schemas.VersionRead
)
def get_document_version(doc_id: int, v_id: int, db: Session = Depends(get_db)):
    version = (
        db.query(models.Version)
        .filter(models.Version.id == v_id, models.Version.document_id == doc_id)
        .first()
    )
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Version not found"
        )
    return version


# POST /documents/{doc_id}/versions -> Create new version 
@app.post(
    "/documents/{doc_id}/versions",
    response_model=schemas.VersionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_document_version(
    doc_id: int, payload: schemas.VersionCreate, db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    # Determine base HTML content to fork from
    base_content = ""
    if payload.base_version_id is not None:
        base_version = (
            db.query(models.Version)
            .filter(
                models.Version.id == payload.base_version_id,
                models.Version.document_id == doc_id,
            )
            .first()
        )
        if not base_version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified base version not found for this document",
            )
        base_content = base_version.content
    elif doc.current_version:
        base_content = doc.current_version.content

    # Calculate sequential version number
    max_version = (
        db.query(func.max(models.Version.version_number))
        .filter(models.Version.document_id == doc_id)
        .scalar()
    ) or 0
    next_version_number = max_version + 1

    # Insert new version record
    new_version = models.Version(
        document_id=doc_id,
        version_number=next_version_number,
        label=payload.label,
        content=base_content,
    )
    db.add(new_version)
    db.flush()

    # Automatically set newly created version as current active version
    doc.current_version_id = new_version.id
    db.commit()
    db.refresh(new_version)

    return new_version


# PATCH /documents/{doc_id}/versions/{v_id} -> Update version content and/or label
@app.patch(
    "/documents/{doc_id}/versions/{v_id}", response_model=schemas.VersionRead
)
def update_document_version(
    doc_id: int,
    v_id: int,
    payload: schemas.VersionUpdate,
    db: Session = Depends(get_db),
):
    version = (
        db.query(models.Version)
        .filter(models.Version.id == v_id, models.Version.document_id == doc_id)
        .first()
    )
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Version not found"
        )

    if payload.content is not None:
        version.content = payload.content
    if payload.label is not None:
        version.label = payload.label

    db.commit()
    db.refresh(version)
    return version


# POST /documents/{doc_id}/current-version -> Switch active version pointer
@app.post(
    "/documents/{doc_id}/current-version", response_model=schemas.DocumentRead
)
def switch_current_version(
    doc_id: int,
    payload: schemas.SwitchVersionRequest,
    db: Session = Depends(get_db),
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    target_version = (
        db.query(models.Version)
        .filter(
            models.Version.id == payload.version_id,
            models.Version.document_id == doc_id,
        )
        .first()
    )
    if not target_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target version not found for this document",
        )

    doc.current_version_id = target_version.id
    db.commit()
    db.refresh(doc)
    return doc

from app.schemas import AiEditRequest, AiEditResponse
from app.services.ai_service import process_ai_edit

@app.post("/ai/edit", response_model=AiEditResponse)
async def handle_ai_edit(request: AiEditRequest):
    """Processes natural language editing commands against document HTML."""
    return await process_ai_edit(request)