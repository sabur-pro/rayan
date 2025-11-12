import { BaseApiService } from './base';
import { 
  ChatMessage, 
  SendMessageRequest, 
  SendMessageResponse, 
  Conversation 
} from '../types/ai';

class AIService extends BaseApiService {
  async sendMessage(
    request: SendMessageRequest,
    accessToken: string
  ): Promise<SendMessageResponse> {
    return this.makeRequest<SendMessageResponse>('/ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
  }

  async getConversations(accessToken: string): Promise<Conversation[]> {
    return this.makeRequest<Conversation[]>('/ai/conversations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async getConversation(
    conversationId: string,
    accessToken: string
  ): Promise<Conversation> {
    return this.makeRequest<Conversation>(`/ai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async deleteConversation(
    conversationId: string,
    accessToken: string
  ): Promise<void> {
    return this.makeRequest<void>(`/ai/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }
}

export const aiService = new AIService();
