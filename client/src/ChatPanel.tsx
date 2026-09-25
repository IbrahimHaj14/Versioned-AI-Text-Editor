import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Attachment, AiEditResponse } from './types';

interface ChatPanelProps {
  documentHtml: string;
  onUpdateDocument: (newHtml: string, summary: string, changeType: string) => void;
  apiBaseUrl?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  documentHtml,
  onUpdateDocument,
  apiBaseUrl = ''
}) => {
  const [instruction, setInstruction] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Read uploaded text files into memory with FileReader API
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      // Limit to text-based attachments (.txt, .md, .json, .html, .xml)
      if (file.size > 2 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 2MB size limit.`);
        return;
      }

      const reader = new FileReader(); // Read file content as text
      reader.onload = (e) => {
        const textContent = e.target?.result as string;
        setAttachments((prev) => {
          if (prev.some((a) => a.filename === file.name)) return prev;
          return [...prev, { filename: file.name, content: textContent }];
        });
      };
      reader.readAsText(file); 
    });
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (filename: string) => {
    setAttachments((prev) => prev.filter((a) => a.filename !== filename));
  };

  // Submit instruction to AI service
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!instruction.trim() || isProcessing) return;

    const userMessageText = instruction.trim(); 
    const currentAttachments = [...attachments];

    // Build user message and append to chat history
    const userMessage: ChatMessage = {
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInstruction('');
    setAttachments([]);
    setIsProcessing(true);

    try {
      // Prepare backend request body
      const payload = {
        document_html: documentHtml,
        instruction: userMessageText,
        chat_history: messages.map(({ role, content }) => ({ role, content })),
        attachments: currentAttachments
      };

      const response = await fetch(`${apiBaseUrl}/ai/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: AiEditResponse = await response.json();

      // Append AI assistant response to history
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.summary,
        summary: data.summary,
        changeType: data.change_type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Trigger parent document update if edits were produced
      if (data.change_type !== 'no_change') {
        onUpdateDocument(data.new_html, data.summary, data.change_type);
      }
    } catch (error) {
      console.error('AI Edit Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Failed to process edit. Please check your network connection or API setup.',
          changeType: 'no_change',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className={`flex flex-col h-full border-l border-gray-200 bg-gray-50 w-80 lg:w-96 transition-colors ${
        isDragging ? 'bg-blue-50 border-blue-400' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">AI Patent Assistant</h2>
        </div>
      </div>

      {/* Indicator */}
      {isDragging && (
        <div className="p-3 bg-blue-100 text-blue-800 text-xs text-center border-b border-blue-200 font-medium">
          Drop text or markdown files to attach
        </div>
      )}

      {/* Message History Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            <p className="font-medium mb-1">No instructions yet</p>
            <p>Try "Renumber claims starting from 1" or "Add a claim for wireless charging".</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p>{msg.content}</p>

                {/* Change Type Badge for Assistant Messages */}
                {msg.role === 'assistant' && msg.changeType && (
                  <div className="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        msg.changeType === 'no_change'
                          ? 'bg-gray-100 text-gray-600'
                          : msg.changeType === 'rewrite'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {msg.changeType.replace('_', ' ')}
                    </span>
                    {msg.timestamp && (
                      <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Spinner Indicator */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-gray-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>
            <span>Generating...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Attachment Badges Bar */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-white border-t border-gray-200 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {attachments.map((att) => (
            <span
              key={att.filename}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-700 border border-gray-300"
            >
              <span className="truncate max-w-[120px]">{att.filename}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.filename)}
                className="text-gray-400 hover:text-red-500 font-bold ml-0.5"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input & Controls Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200 flex flex-col gap-2">
        <div className="relative flex items-center">
          <textarea
            rows={2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Instruct AI (e.g., 'Delete claim 2')..."
            disabled={isProcessing}
            className="w-full text-xs p-2.5 pr-8 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none disabled:bg-gray-100"
          />
        </div>

        <div className="flex items-center justify-between">
          {/* File Picker Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
          >
            Attach File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && processFiles(e.target.files)}
            multiple
            accept=".txt,.md,.json,.html,.xml"
            className="hidden"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!instruction.trim() || isProcessing}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Editing...' : 'Send Instruction'}
          </button>
        </div>
      </form>
    </div>
  );
};