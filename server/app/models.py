from datetime import datetime, timezone
from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.db import Base


class Document(Base):
    __tablename__ = "document"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )

    # Points to current version of the document, if any.
    current_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("version.id", use_alter=True, name="fk_current_version"),
        nullable=True,
    )

    # Relationships
    versions: Mapped[list["Version"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan", # delete versions if document is deleted
        foreign_keys="Version.document_id",
    )

    current_version: Mapped["Version | None"] = relationship(
        foreign_keys=[current_version_id],
        post_update=True,
    )

class Version(Base):
    __tablename__ = "version"

    id: Mapped[int] = mapped_column(primary_key=True, index=True) #primary key
    document_id: Mapped[int] = mapped_column(
        ForeignKey("document.id"), index=True, nullable=False
    )
    
    version_number: Mapped[int] = mapped_column(nullable=False)  # version number for the document.
    label: Mapped[str | None] = mapped_column(String, nullable=True)  # optional label
    content: Mapped[str] = mapped_column(Text, nullable=False) # content stored in version.
    
    created_at: Mapped[datetime] = mapped_column( # timestamp for when the version was created
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column( # timestamp for when the version was last updated
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    

    # Relationships
    document: Mapped["Document"] = relationship( 
        back_populates="versions", 
        foreign_keys=[document_id]
    )

    # version number should be unique for a given document.
    __table_args__ = (
        UniqueConstraint("document_id", "version_number", name="uix_document_version_number"),
    )