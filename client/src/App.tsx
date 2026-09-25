import { useDocument } from "./hooks/useDocument";
import Document from "./Document";
import Sidebar, { formatTimeAgo } from "./Sidebar";
import LoadingOverlay from "./LoadingOverlay";
import { ChatPanel } from './ChatPanel';


export default function App() {
  const {
    currentDocumentId,
    currentVersionId,
    currentContent,
    versions,
    isLoading,
    isUnsaved,
    error,
    setCurrentContent,
    loadDocument,
    saveActiveVersion,
    createNewVersion,
    switchVersion,
    renameVersion,
  } = useDocument(1);

  // Active version currently loaded into Tiptap
  const activeVersion = versions.find((v) => v.id === currentVersionId);

  // Handles updates returned by the AI Chat Panel
  const handleAiUpdateDocument = (newHtml: string, summary: string, changeType: string) => {
    setCurrentContent(newHtml);
    console.log(`Document updated via AI [${changeType}]: ${summary}`);
  };




return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {isLoading && <LoadingOverlay />}

      {/* Top Header */}
      <header className="flex items-center justify-center px-8 bg-black text-white h-[70px] shrink-0">
        <div className="text-lg font-semibold tracking-tight">AI Text Editor</div>
      </header>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-xs shrink-0">
          {error}
        </div>
      )}

      {/* Workstation Layout */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Patent Selector */}
        <div className="flex flex-col items-center gap-2 p-3 bg-white border-r border-gray-200 w-36 shrink-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Select Patent
          </span>
          {[1, 2, 3].map((docId) => (
            <button
              key={docId}
              onClick={() => loadDocument(docId)}
              className={`w-full py-1.5 px-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                currentDocumentId === docId
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Patent {docId}
            </button>
          ))}
        </div>

        {/* Version History Sidebar */}
        <div className="w-56 border-r border-gray-200 bg-white flex flex-col h-full shrink-0">
          <Sidebar
            versions={versions}
            currentVersionId={currentVersionId}
            onSelectVersion={switchVersion}
            onCreateVersion={createNewVersion}
            onRenameVersion={renameVersion}
            isLoading={isLoading}
          />
        </div>

        {/* Editor Workspace */}
        <div className="flex flex-col flex-1 h-full p-6 bg-white overflow-hidden border-r border-gray-200">
          {/* Document Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Patent {currentDocumentId}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Editing Version {activeVersion?.version_number ?? "-"}
              </p>
            </div>

            {/* Save Status */}
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium">
                {isUnsaved ? (
                  <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    ● Unsaved changes
                  </span>
                ) : (
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    ✓ Saved {formatTimeAgo(activeVersion?.updated_at)}
                  </span>
                )}
              </div>

              <button
                onClick={saveActiveVersion}
                disabled={!isUnsaved || isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium text-xs px-4 py-2 rounded transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>

          {/* Tiptap Rich Text Editor */}
          <div className="flex-1 overflow-y-auto">
            <Document
              content={currentContent}
              onContentChange={setCurrentContent}
            />
          </div>
        </div>

        {/* AI Assistant Panel */}
        <ChatPanel
          documentHtml={currentContent}
          onUpdateDocument={handleAiUpdateDocument}
          apiBaseUrl="http://127.0.0.1:8000"
        />
      </div>
    </div>
  );
}













//   return (
//     <div className="flex flex-col h-screen w-full bg-gray-50">
//       {isLoading && <LoadingOverlay />}

//       {/* Top Header */}
//       <header className="flex items-center justify-center px-8 bg-black text-white h-[70px] shrink-0">
//         <img src={Logo} alt="Logo" style={{ height: "40px" }} />
//       </header>

//       {/* Global Error Banner */}
//       {error && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-xs shrink-0">
//           {error}
//         </div>
//       )}

//       {/* Workstation Layout */}
//       <div className="flex flex-1 w-full overflow-hidden">
//         {/* Column 1: Left Patent Navigation */}
//         <div className="flex flex-col items-center gap-2 p-4 bg-white border-r border-gray-200 w-44 shrink-0">
//           <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
//             Select Patent
//           </span>
//           {[1, 2, 3].map((docId) => (
//             <button
//               key={docId}
//               onClick={() => loadDocument(docId)}
//               className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
//                 currentDocumentId === docId
//                   ? "bg-blue-600 text-white shadow-sm"
//                   : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//               }`}
//             >
//               Patent {docId}
//             </button>
//           ))}
//         </div>

//         {/* Column 2: Editor Workspace */}
//         <div className="flex flex-col flex-1 h-full p-6 bg-white overflow-hidden border-r border-gray-200">
//           {/* Header Bar: Patent Title, Dirty State & Save Action */}
//           <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
//             <div>
//               <h2 className="text-xl font-bold text-gray-800">
//                 Patent {currentDocumentId}
//               </h2>
//               <p className="text-xs text-gray-400 mt-0.5">
//                 Editing Version {activeVersion?.version_number ?? "-"}
//               </p>
//             </div>

//             {/* Save Button & Dirty State Badge */}
//             <div className="flex items-center gap-3">
//               <div className="text-xs font-medium">
//                 {isUnsaved ? (
//                   <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
//                     ● Unsaved changes
//                   </span>
//                 ) : (
//                   <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
//                     ✓ Saved {formatTimeAgo(activeVersion?.updated_at)}
//                   </span>
//                 )}
//               </div>

//               <button
//                 onClick={saveActiveVersion}
//                 disabled={!isUnsaved || isLoading}
//                 className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium text-xs px-4 py-2 rounded transition-colors cursor-pointer"
//               >
//                 Save
//               </button>
//             </div>
//           </div>

//           {/* Tiptap Rich Text Editor */}
//           <div className="flex-1 overflow-y-auto">
//             <Document
//               content={currentContent}
//               onContentChange={setCurrentContent}
//             />
//           </div>
//         </div>

//         {/* Column 3: Version History Sidebar */}
//         <Sidebar
//           versions={versions}
//           currentVersionId={currentVersionId}
//           onSelectVersion={switchVersion}
//           onCreateVersion={createNewVersion}
//           onRenameVersion={renameVersion}
//           isLoading={isLoading}
//         />

//         {/* AI Assistant Panel */}
//         <ChatPanel 
//           documentHtml={currentContent} 
//           onUpdateDocument={handleAiUpdateDocument} 
//           apiBaseUrl="http://127.0.0.1:8000"
//         />
//       </div>
//     </div>
//   );
// }



