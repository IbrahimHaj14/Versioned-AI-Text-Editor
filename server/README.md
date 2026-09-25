# Text Editor Backend

FastAPI backend for document persistence, version management, and AI-assisted editing.

## Main Components

- app/__main__.py — FastAPI application and API routes
- app/models.py — SQLAlchemy document and version models
- app/schemas.py — Pydantic request/response schemas
- app/data.py — starter document data
- app/seed.py — database seed logic
- app/services/ai_service.py — structured AI editing and HTML sanitisation
- tests/ — backend unit and API tests

## Setup

This project uses uv for Python dependency management.

~~~bash
uv sync
~~~

Set the OpenAI API key in a root .env file:

~~~env
OPENAI_API_KEY=your_api_key_here
~~~

## Running Locally

~~~bash
uv run uvicorn app.__main__:app --reload
~~~

The application initialises an in-memory SQLite database with starter documents on startup.

## Tests

~~~bash
uv run pytest
~~~