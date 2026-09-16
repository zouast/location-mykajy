import api from '@/services/api';
import type {
  Visit,
  CreateVisitPayload,
  UpdateVisitStatusPayload,
  DayAvailability,
  VisitStatus,
} from '@/types';

export interface VisitsListResponse {
  items: Visit[];
  total: number;
  page: number;
  totalPages: number;
}

export const visitsService = {
  /** Demander un créneau de visite */
  async create(payload: CreateVisitPayload): Promise<Visit> {
    const res = await api.post<{ data: Visit } | Visit>('/visits', payload);
    return (res.data as { data: Visit }).data || res.data;
  },

  /** Récupérer les créneaux disponibles pour une date et une annonce */
  async getAvailability(listingId: string, date: string): Promise<DayAvailability> {
    const res = await api.get<{ data: DayAvailability } | DayAvailability>(
      `/visits/availability?listingId=${listingId}&date=${date}`,
    );
    return (res.data as { data: DayAvailability }).data || res.data;
  },

  /** Consulter les visites du client connecté */
  async getMyVisits(
    status?: VisitStatus,
    page = 1,
    limit = 12,
  ): Promise<VisitsListResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);

    const res = await api.get<{ data: VisitsListResponse } | VisitsListResponse>(
      `/visits/my-visits?${params.toString()}`,
    );
    return (res.data as { data: VisitsListResponse }).data || res.data;
  },

  /** Consulter l'agenda des visites de l'agent / propriétaire */
  async getAgenda(
    status?: VisitStatus,
    fromDate?: string,
    toDate?: string,
    page = 1,
    limit = 50,
  ): Promise<{ items: Visit[]; total: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);

    const res = await api.get<{ data: { items: Visit[]; total: number } } | { items: Visit[]; total: number }>(
      `/visits/agenda?${params.toString()}`,
    );
    return (res.data as { data: { items: Visit[]; total: number } }).data || res.data;
  },

  /** Obtenir le détail d'une visite */
  async getById(id: string): Promise<Visit> {
    const res = await api.get<{ data: Visit } | Visit>(`/visits/${id}`);
    return (res.data as { data: Visit }).data || res.data;
  },

  /** Mettre à jour le statut d'une visite (Confirmation, Annulation, Rejet, Clôture) */
  async updateStatus(id: string, payload: UpdateVisitStatusPayload): Promise<Visit> {
    const res = await api.patch<{ data: Visit } | Visit>(`/visits/${id}/status`, payload);
    return (res.data as { data: Visit }).data || res.data;
  },

  /** Supprimer une visite */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ data: { success: boolean; message: string } } | { success: boolean; message: string }>(
      `/visits/${id}`,
    );
    return (res.data as { data: { success: boolean; message: string } }).data || res.data;
  },

  /** Alias rétrocompatibilité pour getVisits */
  async getVisits(params?: { listingId?: string }): Promise<Visit[]> {
    const query = params?.listingId ? `?listingId=${params.listingId}` : '';
    const res = await api.get<{ data: Visit[] | { items: Visit[] } } | Visit[]>(`/visits${query}`);
    const body: any = res.data;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.data?.items)) return body.data.items;
    return [];
  },

  /** Alias rétrocompatibilité pour createVisit */
  async createVisit(payload: CreateVisitPayload): Promise<Visit> {
    return visitsService.create(payload);
  },
};

export default visitsService;
