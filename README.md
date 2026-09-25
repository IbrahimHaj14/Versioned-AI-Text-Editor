# AI-Assisted Versioned Text Editor

A full-stack text editor with document versioning and an AI assistant for making natural-language edits to rich-text documents.

The project combines a React + TypeScript frontend with a FastAPI backend, SQLite persistence, and structured AI responses. It demonstrates full-stack development, API design, versioned state management, AI integration, validation, and testing.

## Features

- Document versioning: create, switch, edit, save, and rename versions
- Unsaved-change tracking and persistence state
- AI-assisted editing through natural-language instructions
- Chat history for an editing session
- Drag-and-drop and file-picker support for TXT, Markdown, JSON, HTML, and XML reference files
- Pydantic-validated structured AI responses
- Explicit edit, rewrite, and no-change classifications
- Server-side allowlist-based HTML sanitisation
- Unit tests for models, schemas, API routes, seed logic, AI behaviour, and sanitisation

## Architecture

~~~text
React + TypeScript
        |
        | REST API
        v
FastAPI backend
        |
        +---- SQLAlchemy + SQLite
        |
        +---- AI editing service
                  |
                  v
             OpenAI API
~~~

The frontend uses Tiptap for rich-text editing. The backend owns document/version persistence and the AI editing workflow. AI output is validated, sanitised, and returned to the editor as a complete document update.

## Tech Stack

Frontend: React, TypeScript, Vite, Tiptap, Tailwind CSS

Backend: Python, FastAPI, SQLAlchemy, Pydantic, SQLite, pytest

AI: OpenAI API, structured outputs, server-side HTML sanitisation

Development: Docker Compose, uv

## Running Locally

Create a .env file in the project root:

~~~env
OPENAI_API_KEY=your_api_key_here
~~~

Do not commit the .env file or expose API keys publicly.

Start the application:

~~~bash
docker compose up --build
~~~

Then open http://localhost:5173.

Run the backend tests:

~~~bash
docker compose exec server uv run pytest
~~~

## Project Structure

~~~text
.
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── Document.tsx
│   │   ├── Editor.tsx
│   │   ├── Sidebar.tsx
│   │   ├── api.ts
│   │   └── hooks/useDocument.ts
│   └── package.json
├── server/
│   ├── app/
│   │   ├── __main__.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── seed.py
│   │   └── services/ai_service.py
│   ├── tests/
│   └── pyproject.toml
└── docker-compose.yml
~~~

## What I Built

I implemented the document versioning workflow, including version creation, switching, in-place edits, renaming, and persistence state. I also built the AI editing workflow, connecting a chat interface to a structured backend AI service and applying validated HTML changes directly to the editor.

The project also includes automated tests and server-side sanitisation to make AI-generated document updates safer and more predictable.