import api from '@/services/api';
import type {
  Inquiry,
  CreateInquiryPayload,
  UpdateInquiryStatusPayload,
  InquiryStatus,
} from '@/types';

export interface InquiriesListResponse {
  items: Inquiry[];
  total: number;
  page: number;
  totalPages: number;
}

export const inquiriesService = {
  /** Envoyer une demande de contact / message sur un bien */
  async create(payload: CreateInquiryPayload): Promise<Inquiry> {
    const res = await api.post<{ data: Inquiry } | Inquiry>('/inquiries', payload);
    return (res.data as { data: Inquiry }).data || res.data;
  },

  /** Récupérer les demandes envoyées par le client connecté */
  async getMySent(page = 1, limit = 12): Promise<InquiriesListResponse> {
    const res = await api.get<{ data: InquiriesListResponse } | InquiriesListResponse>(
      `/inquiries/sent?page=${page}&limit=${limit}`,
    );
    return (res.data as { data: InquiriesListResponse }).data || res.data;
  },

  /** Récupérer les demandes reçues pour l'agent ou le propriétaire */
  async getReceived(status?: InquiryStatus, page = 1, limit = 12): Promise<InquiriesListResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);

    const res = await api.get<{ data: InquiriesListResponse } | InquiriesListResponse>(
      `/inquiries/received?${params.toString()}`,
    );
    return (res.data as { data: InquiriesListResponse }).data || res.data;
  },

  /** Obtenir le détail d'une demande par ID */
  async getById(id: string): Promise<Inquiry> {
    const res = await api.get<{ data: Inquiry } | Inquiry>(`/inquiries/${id}`);
    return (res.data as { data: Inquiry }).data || res.data;
  },

  /** Mettre à jour le statut et apporter une réponse (Agent / Propriétaire) */
  async updateStatus(id: string, payload: UpdateInquiryStatusPayload): Promise<Inquiry> {
    const res = await api.patch<{ data: Inquiry } | Inquiry>(`/inquiries/${id}/status`, payload);
    return (res.data as { data: Inquiry }).data || res.data;
  },

  /** Supprimer une demande */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ data: { success: boolean; message: string } } | { success: boolean; message: string }>(
      `/inquiries/${id}`,
    );
    return (res.data as { data: { success: boolean; message: string } }).data || res.data;
  },
};
