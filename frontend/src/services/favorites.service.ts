import api from '@/services/api';
import type { FavoritesResponse, FavoriteItem } from '@/types';

export const favoritesService = {
  /** Récupérer la liste paginée de ses favoris */
  async getFavorites(page = 1, limit = 12): Promise<FavoritesResponse> {
    const res = await api.get<{ data: FavoritesResponse } | FavoritesResponse>(
      `/favorites?page=${page}&limit=${limit}`,
    );
    return (res.data as { data: FavoritesResponse }).data || res.data;
  },

  /** Récupérer la liste des IDs des annonces favorites */
  async getFavoriteIds(): Promise<string[]> {
    const res = await api.get<{ data: { listingIds: string[] } } | { listingIds: string[] }>(
      '/favorites/ids',
    );
    const data = (res.data as { data: { listingIds: string[] } }).data || res.data;
    return data.listingIds || [];
  },

  /** Vérifier si une annonce est en favori */
  async isFavorite(listingId: string): Promise<boolean> {
    const res = await api.get<{ data: { isFavorite: boolean } } | { isFavorite: boolean }>(
      `/favorites/check/${listingId}`,
    );
    const data = (res.data as { data: { isFavorite: boolean } }).data || res.data;
    return !!data.isFavorite;
  },

  /** Ajouter aux favoris */
  async addFavorite(listingId: string): Promise<FavoriteItem> {
    const res = await api.post<{ data: FavoriteItem } | FavoriteItem>(`/favorites/${listingId}`);
    return (res.data as { data: FavoriteItem }).data || res.data;
  },

  /** Retirer des favoris */
  async removeFavorite(listingId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ data: { success: boolean; message: string } } | { success: boolean; message: string }>(
      `/favorites/${listingId}`,
    );
    return (res.data as { data: { success: boolean; message: string } }).data || res.data;
  },
};
