from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Literal
from pydantic import BaseModel, Field


class VersionSummary(BaseModel):
    """Metadata summary for a document version, without html content, for sidebar listings."""
    id: int
    document_id: int
    version_number: int
    label: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VersionRead(VersionSummary):
    """Full version representation including HTML content."""
    content: str


class VersionCreate(BaseModel):
    """Payload for creating a new version snapshot."""
    label: str | None = None
    base_version_id: int | None = None  # Fork from specific base version if provided


class VersionUpdate(BaseModel):
    """Update payload for modifying an existing version's content and/or label."""
    content: str | None = None
    label: str | None = None


class SwitchVersionRequest(BaseModel):
    """Payload for switching a document's active version pointer."""
    version_id: int


class DocumentRead(BaseModel):
    """Full document representation including its currently active version."""
    id: int
    title: str
    created_at: datetime
    current_version_id: int | None = None
    current_version: VersionRead | None = None

    model_config = ConfigDict(from_attributes=True)


class DocumentSummary(BaseModel):
    """Metadata summary for a document, without version details."""
    id: int
    title: str
    created_at: datetime
    current_version_id: int | None = None

    model_config = ConfigDict(from_attributes=True)



# Schemas for AI editing requests and responses
class ChatMessage(BaseModel):
    """Represents a single message in the chat history for AI editing context."""
    role: Literal["user", "assistant"]
    content: str

class Attachment(BaseModel):
    """Represents a file attachment that can be included in the AI editing request."""
    filename: str
    content: str

class AiEditRequest(BaseModel):
    """Payload for requesting AI-based edits to a document version."""
    document_html: str
    instruction: str
    chat_history: List[ChatMessage] = Field(default_factory=list)
    attachments: List[Attachment] = Field(default_factory=list)

class AiEditResponse(BaseModel):
    """Response from the LLM."""
    new_html: str
    summary: str
    change_type: Literal["edit", "rewrite", "no_change"]