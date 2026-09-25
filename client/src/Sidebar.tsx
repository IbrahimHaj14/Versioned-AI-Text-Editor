// client/src/components/Sidebar.tsx
import React, { useState } from "react";
import { VersionSummary } from "./api";

// Props for the VersionSidebar component

interface SidebarProps {
  versions: VersionSummary[];
  currentVersionId: number | null;
  onSelectVersion: (versionId: number) => void; 
  onCreateVersion: (label?: string) => void; 
  onRenameVersion: (versionId: number, newLabel: string) => void;
  isLoading?: boolean; //
}

// function to display how long ago a version was updated from the current time.
export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "";

  // Ensure the date string is in UTC format for consistent parsing
  const utcDateString =
    dateString.endsWith("Z") || dateString.includes("+")
      ? dateString
      : `${dateString}Z`;

  const date = new Date(utcDateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

//Sidebar component that displays version history and allows operations.
export default function Sidebar({
  versions,
  currentVersionId,
  onSelectVersion,
  onCreateVersion,
  onRenameVersion,
  isLoading = false,
}: SidebarProps) {
  const [editingVersionId, setEditingVersionId] = useState<number | null>(null);
  const [editLabelText, setEditLabelText] = useState<string>("");

  const handleStartRename = (v: VersionSummary, e: React.MouseEvent) => {
    e.stopPropagation(); // only start editing when the rename button is clicked.
    setEditingVersionId(v.id);
    setEditLabelText(v.label || "");
  };

  const handleSaveRename = (versionId: number) => { // saves the renamed version
    if (editLabelText.trim()) {
      onRenameVersion(versionId, editLabelText.trim()); 
    }
    setEditingVersionId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, versionId: number) => { // saves when enter is pressed.
    if (e.key === "Enter") {
      handleSaveRename(versionId);
    } else if (e.key === "Escape") { // cancels editing when escape is pressed.
      setEditingVersionId(null);
    }
  };

  return (
    <aside className="w-full bg-gray-50 border-l border-gray-200 flex flex-col h-full p-4 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Version History</h3>
        <button
          onClick={() => onCreateVersion()}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50 cursor-pointer"
        >
          + New Version
        </button>
      </div>

      {versions.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No version history available.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {versions.map((v) => {
            const isActive = v.id === currentVersionId;
            const isEditing = editingVersionId === v.id;

            return (
              <div
                key={v.id}
                onClick={() => !isEditing && onSelectVersion(v.id)}
                className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-50 border-blue-500 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-100/50"
                }`}
              >
                {/* Top Row: Version Badge & Timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      v{v.version_number}
                    </span>
                    {isActive && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600">
                        Active
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(v.updated_at)}
                  </span>
                </div>

                {/* Version Label */}
                <div className="mt-2.5 flex flex-col gap-1 min-h-[24px]">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editLabelText}
                      onChange={(e) => setEditLabelText(e.target.value)}
                      onBlur={() => handleSaveRename(v.id)}
                      onKeyDown={(e) => handleKeyDown(e, v.id)}
                      autoFocus
                      className="text-xs border border-blue-400 rounded px-1.5 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  ) : (
                    <>
                      {/* Name */}
                      <span className="text-xs text-gray-700 font-medium truncate block">
                        {v.label || "Untitled"}
                      </span>

                      {/* Rename Button */}
                      <button
                        onClick={(e) => handleStartRename(v, e)}
                        title="Rename version"
                        className="text-[10px] text-gray-400 hover:text-blue-600 self-start opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Rename Label
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

