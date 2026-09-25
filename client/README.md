# Text Editor Frontend

React and TypeScript frontend for the versioned text editor.

## Main Components

- App.tsx — application shell and editor workspace
- Document.tsx — document container
- Editor.tsx — Tiptap rich-text editor
- ChatPanel.tsx — AI editing interface and file attachments
- Sidebar.tsx — version history and version controls
- hooks/useDocument.ts — document/version state management
- api.ts — backend API client

## Running Locally

~~~bash
npm install
npm run dev
~~~

The frontend expects the FastAPI backend to be available at http://127.0.0.1:8000.