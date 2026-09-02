import api from '@/services/api';
import type {
  SavedSearch,
  CreateSavedSearchPayload,
  UpdateSavedSearchPayload,
  ListingSearchResponse,
} from '@/types';

export const savedSearchesService = {
  /** Récupérer toutes les recherches sauvegardées de l'utilisateur */
  async getAll(): Promise<SavedSearch[]> {
    const res = await api.get<{ data: SavedSearch[] } | SavedSearch[]>('/saved-searches');
    return (res.data as { data: SavedSearch[] }).data || res.data;
  },

  /** Récupérer une recherche sauvegardée par ID */
  async getById(id: string): Promise<SavedSearch> {
    const res = await api.get<{ data: SavedSearch } | SavedSearch>(`/saved-searches/${id}`);
    return (res.data as { data: SavedSearch }).data || res.data;
  },

  /** Créer une recherche sauvegardée */
  async create(payload: CreateSavedSearchPayload): Promise<SavedSearch> {
    const res = await api.post<{ data: SavedSearch } | SavedSearch>('/saved-searches', payload);
    return (res.data as { data: SavedSearch }).data || res.data;
  },

  /** Modifier une recherche sauvegardée */
  async update(id: string, payload: UpdateSavedSearchPayload): Promise<SavedSearch> {
    const res = await api.patch<{ data: SavedSearch } | SavedSearch>(`/saved-searches/${id}`, payload);
    return (res.data as { data: SavedSearch }).data || res.data;
  },

  /** Supprimer une recherche sauvegardée */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ data: { success: boolean; message: string } } | { success: boolean; message: string }>(
      `/saved-searches/${id}`,
    );
    return (res.data as { data: { success: boolean; message: string } }).data || res.data;
  },

  /** Obtenir les annonces correspondant à une recherche sauvegardée */
  async getMatches(id: string, page = 1, limit = 12): Promise<ListingSearchResponse> {
    const res = await api.get<{ data: ListingSearchResponse } | ListingSearchResponse>(
      `/saved-searches/${id}/matches?page=${page}&limit=${limit}`,
    );
    return (res.data as { data: ListingSearchResponse }).data || res.data;
  },
};
