import api from './api';
import type {
  ConversationItem,
  ChatMessage,
  CreateConversationInput,
  SendMessageInput,
} from '@/types';

export const conversationService = {
  /** Récupérer la liste des conversations */
  async getConversations(
    page = 1,
    limit = 20,
    search?: string,
    unreadOnly = false,
    listingId?: string,
  ): Promise<{ items: ConversationItem[]; total: number; unreadCount: number }> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set('search', search);
    if (unreadOnly) params.set('unreadOnly', 'true');
    if (listingId) params.set('listingId', listingId);

    const res = await api.get<{ data: any } | any>(`/conversations?${params.toString()}`);
    return (res.data as { data: any }).data || res.data;
  },

  /** Récupérer une conversation par son ID */
  async getConversationById(id: string): Promise<ConversationItem> {
    const res = await api.get<{ data: ConversationItem } | ConversationItem>(
      `/conversations/${id}`,
    );
    return (res.data as { data: ConversationItem }).data || res.data;
  },

  /** Créer ou démarrer une conversation */
  async createConversation(input: CreateConversationInput): Promise<ConversationItem> {
    const res = await api.post<{ data: ConversationItem } | ConversationItem>(
      '/conversations',
      input,
    );
    return (res.data as { data: ConversationItem }).data || res.data;
  },

  /** Récupérer les messages d'une conversation */
  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<{ items: ChatMessage[]; total: number }> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const res = await api.get<{ data: any } | any>(
      `/conversations/${conversationId}/messages?${params.toString()}`,
    );
    return (res.data as { data: any }).data || res.data;
  },

  /** Envoyer un message dans une conversation */
  async sendMessage(
    conversationId: string,
    input: SendMessageInput,
  ): Promise<ChatMessage> {
    const res = await api.post<{ data: ChatMessage } | ChatMessage>(
      `/conversations/${conversationId}/messages`,
      input,
    );
    return (res.data as { data: ChatMessage }).data || res.data;
  },

  /** Marquer une conversation comme lue */
  async markAsRead(conversationId: string): Promise<{ success: boolean }> {
    const res = await api.patch<{ success: boolean }>(
      `/conversations/${conversationId}/read`,
    );
    return res.data;
  },

  /** Archiver / désarchiver une conversation */
  async toggleArchive(conversationId: string): Promise<{ isArchived: boolean }> {
    const res = await api.patch<{ isArchived: boolean }>(
      `/conversations/${conversationId}/archive`,
    );
    return res.data;
  },
};
