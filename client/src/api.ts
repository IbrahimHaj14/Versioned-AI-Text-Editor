// client/src/api.ts


// Interfaces for API data structures

export interface VersionSummary {
  id: number;
  document_id: number;
  version_number: number;
  label?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VersionRead extends VersionSummary {
  content: string;
}

export interface DocumentRead {
  id: number;
  title: string;
  created_at: string;
  current_version_id?: number | null;
  current_version?: VersionRead | null;
}

export interface VersionCreate {
  label?: string;
  content?: string;
  fork_from_version_id?: number;
}

export interface VersionUpdate {
  label?: string;
  content?: string;
}

export interface SwitchVersionRequest {
  version_id: number;
}

// API Client

const API_BASE_URL = "http://localhost:8000";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `API Request failed with status ${res.status}`
    );
  }

  return res.json();
}

export const api = {
  // Get document metadata and current version.
  getDocument: (docId: number): Promise<DocumentRead> =>
    request<DocumentRead>(`/documents/${docId}`),

  //  List all version summaries (lightweight metadata)
  listVersions: (docId: number): Promise<VersionSummary[]> =>
    request<VersionSummary[]>(`/documents/${docId}/versions`),

  //  Get specific version content
  getVersion: (docId: number, versionId: number): Promise<VersionRead> =>
    request<VersionRead>(`/documents/${docId}/versions/${versionId}`),

  // Create version 
  createVersion: (
    docId: number,
    data: VersionCreate = {}
  ): Promise<VersionRead> =>
    request<VersionRead>(`/documents/${docId}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update version label and/or content
  updateVersion: (
    docId: number,
    versionId: number,
    data: VersionUpdate
  ): Promise<VersionRead> =>
    request<VersionRead>(`/documents/${docId}/versions/${versionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Switch current version of a document
  switchCurrentVersion: (
    docId: number,
    versionId: number
  ): Promise<DocumentRead> =>
    request<DocumentRead>(`/documents/${docId}/current-version`, {
      method: "POST",
      body: JSON.stringify({ version_id: versionId }),
    }),
};