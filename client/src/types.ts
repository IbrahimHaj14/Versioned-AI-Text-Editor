// client/src/types.ts
// Interfaces for AI service request and response
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  summary?: string;
  changeType?: 'edit' | 'rewrite' | 'no_change';
  timestamp?: string;
}

export interface Attachment {
  filename: string;
  content: string;
}

export interface AiEditRequest {
  document_html: string;
  instruction: string;
  chat_history: ChatMessage[];
  attachments: Attachment[];
}

export interface AiEditResponse {
  new_html: string;
  summary: string;
  change_type: 'edit' | 'rewrite' | 'no_change';
}