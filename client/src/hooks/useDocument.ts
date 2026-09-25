// client/src/hooks/useDocument.ts
import { useState, useEffect, useCallback } from "react";
import { api, VersionSummary } from "../api";


// Custom React hook for managing document state and versioning
export function useDocument(initialDocId: number = 1) {
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>( // The ID of the currently loaded document
    null
  );
  const [currentVersionId, setCurrentVersionId] = useState<number | null>( // The ID of the currently active version
    null
  );
  const [currentContent, setCurrentContent] = useState<string>("");
  const [savedContent, setSavedContent] = useState<string>("");
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); //state to track loading status for API calls
  const [error, setError] = useState<string | null>(null); // State to track any errors during API calls

  // checks if the current content has unsaved changes compared to the last saved content
  const isUnsaved = currentContent !== savedContent;

  // 1. Load a document and its version history
  const loadDocument = useCallback(async (docId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const doc = await api.getDocument(docId);
      const versionList = await api.listVersions(docId);

      setCurrentDocumentId(doc.id);
      setVersions(versionList);

      if (doc.current_version) {
        setCurrentVersionId(doc.current_version.id);
        setCurrentContent(doc.current_version.content);
        setSavedContent(doc.current_version.content);
      } else {
        setCurrentVersionId(null);
        setCurrentContent("");
        setSavedContent("");
      }
    } catch (err: any) {
      console.error("Error loading document:", err);
      setError(err.message || "Failed to load document");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load the initial document when the hook is first used
  useEffect(() => {
    loadDocument(initialDocId);
  }, [loadDocument, initialDocId]);

  // 2. Save changes to the currently active version
  const saveActiveVersion = useCallback(async () => {
    if (!currentDocumentId || !currentVersionId) return;

    setIsLoading(true);
    setError(null);
    try {
      const updatedVersion = await api.updateVersion(
        currentDocumentId,
        currentVersionId,
        { content: currentContent }
      );
      setSavedContent(updatedVersion.content);

      // Refresh version list to update updated_at timestamp
      const versionList = await api.listVersions(currentDocumentId);
      setVersions(versionList);
    } catch (err: any) {
      console.error("Error saving active version:", err);
      setError(err.message || "Failed to save version");
    } finally {
      setIsLoading(false);
    }
  }, [currentDocumentId, currentVersionId, currentContent]);

  // 3. Create a brand new version snapshot
  const createNewVersion = useCallback(
    async (label?: string) => {
      if (!currentDocumentId) return;

      setIsLoading(true);
      setError(null);
      try {
        const newVersion = await api.createVersion(currentDocumentId, {
          label,
          content: currentContent,
        });

        // Backend automatically updates document.current_version_id to new version
        setCurrentVersionId(newVersion.id);
        setSavedContent(newVersion.content);

        // Refresh version list
        const versionList = await api.listVersions(currentDocumentId);
        setVersions(versionList);
      } catch (err: any) {
        console.error("Error creating new version:", err);
        setError(err.message || "Failed to create new version");
      } finally {
        setIsLoading(false);
      }
    },
    [currentDocumentId, currentContent]
  );

  // 4. Switch current active version
  const switchVersion = useCallback(
    async (versionId: number) => {
      if (!currentDocumentId) return;

      setIsLoading(true);
      setError(null);
      try {
        // Update current version pointer on backend
        await api.switchCurrentVersion(currentDocumentId, versionId);

        // Fetch full content of the selected version
        const targetVersion = await api.getVersion(
          currentDocumentId,
          versionId
        );

        setCurrentVersionId(targetVersion.id);
        setCurrentContent(targetVersion.content);
        setSavedContent(targetVersion.content);
      } catch (err: any) {
        console.error("Error switching version:", err);
        setError(err.message || "Failed to switch version");
      } finally {
        setIsLoading(false);
      }
    },
    [currentDocumentId]
  );

  // 5. Rename a version (label edit)
  const renameVersion = useCallback(
    async (versionId: number, newLabel: string) => {
      if (!currentDocumentId) return;

      setIsLoading(true);
      setError(null);
      try {
        await api.updateVersion(currentDocumentId, versionId, {
          label: newLabel,
        });

        // Refresh version list to update UI label
        const versionList = await api.listVersions(currentDocumentId);
        setVersions(versionList);
      } catch (err: any) {
        console.error("Error renaming version:", err);
        setError(err.message || "Failed to rename version");
      } finally {
        setIsLoading(false);
      }
    },
    [currentDocumentId]
  );

  return {
    // returned state
    currentDocumentId,
    currentVersionId,
    currentContent,
    savedContent,
    versions,
    isLoading,
    isUnsaved,
    error,

    // returned actions
    setCurrentContent,
    loadDocument,
    saveActiveVersion,
    createNewVersion,
    switchVersion,
    renameVersion,
  };
}