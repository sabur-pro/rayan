export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  id: string;
  response: string;
  conversationId: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  isAvailable: boolean;
}

// Types for new SSE-based AI Chat API
export interface ChatQueryRequest {
  file_url: string;
  question: string;
  chat_id?: string;
}

export interface ChatMetadata {
  chat_id: string;
  file_processed: boolean;
  sources: number;
}

export interface ChatEventData {
  type: 'status' | 'answer' | 'metadata' | 'complete';
  content: string;
  metadata?: ChatMetadata;
}

export interface ChatSession {
  chatId: string | null;
  fileUrl: string;
  materialName: string;
  messages: ChatSessionMessage[];
  createdAt: Date;
}

export interface ChatSessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// Chat History Types
export interface ChatHistorySession {
  id: string;
  user_id: number;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryResponse {
  count: number;
  sessions: ChatHistorySession[];
}

export interface ChatHistoryMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sequence_num: number;
  created_at: string;
}

export interface ChatMessagesResponse {
  chat_id: string;
  count: number;
  messages: ChatHistoryMessage[];
  pagination: {
    has_more: boolean;
    limit: number;
    offset: number;
  };
  title: string;
  total_messages: number;
}
