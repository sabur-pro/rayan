import { ChatQueryRequest, ChatEventData, ChatMetadata, ChatHistoryResponse, ChatMessagesResponse } from '../types/ai';

const CHAT_API_BASE_URL = 'https://api.medlife.tj/agent/api';

export type SSECallback = (event: ChatEventData) => void;
export type TokenRefreshCallback = () => Promise<string | null>;

class ChatService {
  private xhr: XMLHttpRequest | null = null;
  private tokenRefreshCallback: TokenRefreshCallback | null = null;

  /**
   * Sends a query to the AI chat API and processes Server-Sent Events (SSE) stream.
   * @param request - The chat query request with file_url, question, and optional chat_id
   * @param onEvent - Callback function called for each SSE event
   * @param accessToken - Optional access token for authentication
   */
  async streamQuery(
    request: ChatQueryRequest,
    onEvent: SSECallback,
    accessToken?: string
  ): Promise<void> {
    console.log('[ChatService] Starting stream query...');
    console.log('[ChatService] Request:', JSON.stringify(request, null, 2));
    
    // Cancel any ongoing request
    this.cancelStream();

    return new Promise((resolve, reject) => {
      try {
        this.xhr = new XMLHttpRequest();
        
        const url = `${CHAT_API_BASE_URL}/query/stream`;
        console.log('[ChatService] Opening connection to:', url);
        
        this.xhr.open('POST', url, true);
        this.xhr.setRequestHeader('Content-Type', 'application/json');
        this.xhr.setRequestHeader('Accept', 'text/event-stream');
        
        if (accessToken) {
          this.xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
          console.log('[ChatService] Auth token set');
        }

        let buffer = '';

        this.xhr.onprogress = () => {
          const responseText = this.xhr?.responseText || '';
          
          // Only process new data
          if (responseText.length > buffer.length) {
            const newData = responseText.substring(buffer.length);
            buffer = responseText;
            
            console.log('[ChatService] Received chunk length:', newData.length);
            if (newData.length < 200) {
              console.log('[ChatService] Chunk content:', newData);
            }
            
            // Parse SSE events from new data
            this.parseSSEChunk(newData, onEvent);
          }
        };

        this.xhr.onload = async () => {
          console.log('[ChatService] Stream completed');
          console.log('[ChatService] Final status:', this.xhr?.status);
          
          if (this.xhr && this.xhr.status === 401) {
            console.log('[ChatService] Received 401 in SSE stream, attempting to refresh token...');
            const newToken = await this.handleUnauthorized();
            
            if (newToken) {
              console.log('[ChatService] Retrying SSE stream with new token...');
              this.xhr = null;
              // Retry the stream query with new token
              try {
                await this.streamQuery(request, onEvent, newToken);
                resolve();
              } catch (retryError) {
                reject(retryError);
              }
              return;
            } else {
              const error = new Error('Authentication failed - unable to refresh token');
              console.error('[ChatService] Auth error:', error);
              reject(error);
              this.xhr = null;
              return;
            }
          }
          
          if (this.xhr && this.xhr.status >= 200 && this.xhr.status < 300) {
            resolve();
          } else {
            const error = new Error(`HTTP error! status: ${this.xhr?.status}`);
            console.error('[ChatService] HTTP error:', error);
            reject(error);
          }
          
          this.xhr = null;
        };

        this.xhr.onerror = () => {
          const error = new Error('Network error occurred');
          console.error('[ChatService] Network error:', error);
          reject(error);
          this.xhr = null;
        };

        this.xhr.onabort = () => {
          console.log('[ChatService] Stream cancelled by user');
          resolve();
          this.xhr = null;
        };

        const body = JSON.stringify(request);
        console.log('[ChatService] Sending request body...');
        this.xhr.send(body);
      } catch (error) {
        console.error('[ChatService] Error setting up stream:', error);
        reject(error);
      }
    });
  }

  /**
   * Parses SSE chunk and triggers callbacks
   */
  private parseSSEChunk(chunk: string, onEvent: SSECallback): void {
    const lines = chunk.split('\n');
    let currentEvent: { type?: string; data: string[] } = { data: [] };
    let inDataBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if this is a new event
      if (trimmedLine.startsWith('event:')) {
        // Finish previous event if exists
        if (currentEvent.type && currentEvent.data.length > 0) {
          const combinedData = currentEvent.data.join('\n');
          const event = this.parseEvent(currentEvent.type, combinedData);
          console.log('[ChatService] ✅ Event:', event.type, '- length:', event.content.length);
          onEvent(event);
          currentEvent = { data: [] };
        }
        
        currentEvent.type = trimmedLine.substring(6).trim();
        inDataBlock = false;
        continue;
      }

      // Check if this is data line
      if (trimmedLine.startsWith('data:')) {
        const dataContent = line.substring(line.indexOf('data:') + 5).trim();
        currentEvent.data.push(dataContent);
        inDataBlock = true;
        continue;
      }

      // Empty line - finish event only if we were in data block
      if (trimmedLine === '') {
        if (inDataBlock && currentEvent.type && currentEvent.data.length > 0) {
          const combinedData = currentEvent.data.join('\n');
          const event = this.parseEvent(currentEvent.type, combinedData);
          console.log('[ChatService] ✅ Event:', event.type, '- length:', event.content.length);
          onEvent(event);
          currentEvent = { data: [] };
          inDataBlock = false;
        }
        continue;
      }

      // If we're in a data block and line doesn't start with event:, 
      // treat it as continuation of data
      if (inDataBlock && currentEvent.type) {
        currentEvent.data.push(trimmedLine);
      }
    }

    // Handle any remaining event at end of chunk
    if (currentEvent.type && currentEvent.data.length > 0) {
      const combinedData = currentEvent.data.join('\n');
      const event = this.parseEvent(currentEvent.type, combinedData);
      console.log('[ChatService] ✅ Final event:', event.type, '- length:', event.content.length);
      onEvent(event);
    }
  }


  /**
   * Parses a single SSE event
   */
  private parseEvent(type: string, data: string): ChatEventData {
    let metadata: ChatMetadata | undefined;

    // Try to parse metadata from JSON
    if (type === 'metadata') {
      try {
        metadata = JSON.parse(data);
      } catch (e) {
        console.error('[ChatService] Failed to parse metadata:', e);
      }
    }

    return {
      type: type as ChatEventData['type'],
      content: data,
      metadata,
    };
  }

  /**
   * Sets the token refresh callback
   */
  setTokenRefreshCallback(callback: TokenRefreshCallback): void {
    this.tokenRefreshCallback = callback;
  }

  /**
   * Attempts to refresh the token and retry the request
   */
  private async handleUnauthorized(): Promise<string | null> {
    console.log('[ChatService] Handling 401 - attempting token refresh...');
    
    if (!this.tokenRefreshCallback) {
      console.error('[ChatService] No token refresh callback set');
      return null;
    }

    try {
      const newToken = await this.tokenRefreshCallback();
      if (newToken) {
        console.log('[ChatService] Token refreshed successfully');
        return newToken;
      } else {
        console.error('[ChatService] Token refresh failed');
        return null;
      }
    } catch (error) {
      console.error('[ChatService] Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(accessToken: string): Promise<ChatHistoryResponse> {
    console.log('[ChatService] Fetching chat history...');
    
    return this.makeAuthenticatedRequest<ChatHistoryResponse>(
      `${CHAT_API_BASE_URL}/chat/history`,
      {
        method: 'GET',
      },
      accessToken
    );
  }

  /**
   * Get messages for a specific chat
   */
  async getChatMessages(
    chatId: string,
    limit: number = 50,
    offset: number = 0,
    accessToken: string
  ): Promise<ChatMessagesResponse> {
    console.log(`[ChatService] Fetching messages for chat ${chatId}, limit: ${limit}, offset: ${offset}`);
    
    return this.makeAuthenticatedRequest<ChatMessagesResponse>(
      `${CHAT_API_BASE_URL}/chat/${chatId}/messages?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
      },
      accessToken
    );
  }

  /**
   * Helper method for authenticated requests with 401 retry
   */
  private async makeAuthenticatedRequest<T>(
    url: string,
    options: RequestInit,
    accessToken: string,
    isRetry: boolean = false
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    };

    console.log(`[ChatService] Making request to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[ChatService] Response status: ${response.status}`);

    // Handle 401 Unauthorized
    if (response.status === 401 && !isRetry) {
      console.log('[ChatService] Received 401, attempting to refresh token...');
      const newToken = await this.handleUnauthorized();
      
      if (newToken) {
        console.log('[ChatService] Retrying request with new token...');
        return this.makeAuthenticatedRequest<T>(url, options, newToken, true);
      } else {
        throw new Error('Authentication failed - unable to refresh token');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ChatService] HTTP error ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('[ChatService] Request successful');
    return data;
  }

  /**
   * Cancels the current streaming request
   */
  cancelStream(): void {
    console.log('[ChatService] Cancelling stream...');
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
      console.log('[ChatService] Stream cancelled');
    }
  }
}

export const chatService = new ChatService();
