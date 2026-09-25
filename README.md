# Solve Intelligence Engineering Challenge

## Objective

You have received a mock-up of a patent reviewing application from a junior colleague. It is incomplete and needs work. Your job is to extend and improve it to a standard you'd be comfortable shipping to production. This means:

- Clean code that is production quality
- Unit tests
- No bugs

After completing the tasks below, add a couple of sentences to the end of this file briefly outlining what improvements you made.

## Docker

Make sure you create a .env file (see .env.example) with the OpenAI API key we have provided.

To build and run the application using Docker, execute the following command:

```
docker-compose up --build
```

## Task 1: Implement Document Versioning

Currently, the user can save a document, but there is no concept of **versioning**. Paying customers have expressed an interest in this and have requested the following:

1. The ability to create new versions
2. The ability to switch between existing versions
3. The ability to make changes to any of the existing versions and save those changes (without creating a new version)

You will need to modify the database model (`app/models.py`), add some API routes (`app/__main__.py`), and update the client-side code accordingly.

## Task 2: Choose One of the Following

Complete **one** of the two options below.

### Option A: AI-Powered Document Editing

Implement a chat interface that allows users to edit the patent document using natural language instructions.

Minimal Requirements:
1. A chat-style UI panel where users can type editing instructions
2. The AI should interpret the instruction and modify the document HTML accordingly
3. Changes should be applied to the editor and visible immediately
4. Support drag-and-drop .txt file upload to the chat to provide additional context for the AI


Example instructions your solution should handle:
- "Make claim 1 bold"
- "Delete claim 3"
- "Add a new dependent claim after claim 2 that specifies the material is glass"
- "Write a background section based on the prior art file I have uploaded"

### Option B: Live Collaboration

Implement real-time collaborative editing so multiple users can work on the same document simultaneously.

Minimal Requirements:
1. Multiple users should be able to view and edit the same document at the same time
2. Changes made by one user should appear in real-time for all other users
3. Show presence indicators (e.g., cursors, user avatars) to indicate where other users are editing
4. Handle conflict resolution gracefully when multiple users edit the same section

## Note
You may use AI (and the API key we have provided) to assist with coding on this task. When we review submissions we will stress test your solution across a range of inputs and common user behaviours, so do consider this when designing your solution. 

If your submission passes our review, the next stage will involve pair programming without AI assistance.

Good luck!

## Improvements Made

Task 1: Updated database models, REST endpoints, and the React client (`useDocument` hook and `Sidebar`) for version control, including switching versions, in-place saving with unsaved tracking, creating new versions, and label renaming. New versions are created from the current active version.
Task 2 (Option A - AI Document Editing): Built an interactive AI chat interface supporting natural language document edits and integrated drag-and-drop file upload. Enforced TipTap schema rules in the backend AI prompt to ensure generated HTML updates into the active editor canvas. Implemented backend HTML sanitisation to strip unsafe attributes.

Architecture & UI Hygiene: Cleaned up workstation component layouts, added backend API response validation, and established state synchronisation between backend version persistence and Tiptap frontend state.

Tests: Wrote unit tests covering database models, API endpoints, seed logic, and AI sanitisation.

## Run instructions:
1. Add OPENAI_API_KEY to .env in the root directory.
2. Run: docker compose up --build
3. Access Frontend at http://localhost:5173
4. Run Unit Tests: docker compose exec server uv run pytest

Looking forward to hearing from you.

Thanks,
Ibrahim
