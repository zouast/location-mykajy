import api from '@/services/api';
import type {
  ListingSearchResponse,
  ListingSearchFilters,
  ListingSearchResult,
  Agency,
  PropertyType,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export type { ListingSearchFilters } from '@/types';

// ─── Listings / Search ────────────────────────────────────────────────────────

export const listingsService = {
  /**
   * Moteur de recherche principal — GET /listings
   * Retourne des résultats enrichis (photo, localisation, prix formaté).
   */
  async search(filters: ListingSearchFilters = {}): Promise<ListingSearchResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') params.set(key, String(val));
    });
    const res = await api.get<ApiResponse<ListingSearchResponse>>(`/listings?${params.toString()}`);
    return res.data.data;
  },

  /** Détail d'une annonce par ID — GET /listings/:id */
  async getById(id: string): Promise<ListingSearchResult> {
    const res = await api.get<ApiResponse<ListingSearchResult>>(`/listings/${id}`);
    return res.data.data;
  },

  /**
   * Annonces à louer (RENT) — alias de search avec transactionType=RENT
   */
  async getRentals(filters: Omit<ListingSearchFilters, 'transactionType'> = {}): Promise<ListingSearchResponse> {
    return listingsService.search({ ...filters, transactionType: 'RENT' });
  },

  /**
   * Biens à vendre (SALE) — alias de search avec transactionType=SALE
   */
  async getSales(filters: Omit<ListingSearchFilters, 'transactionType'> = {}): Promise<ListingSearchResponse> {
    return listingsService.search({ ...filters, transactionType: 'SALE' });
  },

  /**
   * Biens récents — triés par date décroissante, limités
   */
  async getRecent(limit = 6): Promise<ListingSearchResult[]> {
    const res = await listingsService.search({ sortBy: 'date', sortOrder: 'desc', limit });
    return res.items;
  },

  /**
   * Biens populaires — triés par nombre de vues
   */
  async getPopular(limit = 6): Promise<ListingSearchResult[]> {
    const res = await listingsService.search({ sortBy: 'relevance', limit });
    return res.items;
  },
};

// ─── Agencies ─────────────────────────────────────────────────────────────────

export const agenciesService = {
  async getAll(filters: { page?: number; limit?: number; q?: string } = {}): Promise<PaginatedResponse<Agency>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') params.set(key, String(val));
    });
    const res = await api.get<ApiResponse<PaginatedResponse<Agency>>>(`/agencies?${params.toString()}`);
    return res.data.data;
  },

  async getById(id: string): Promise<Agency> {
    const res = await api.get<ApiResponse<Agency>>(`/agencies/${id}`);
    return res.data.data;
  },
};

// ─── Property Types ───────────────────────────────────────────────────────────

export const propertyTypesService = {
  async getAll(): Promise<PropertyType[]> {
    const res = await api.get<ApiResponse<PropertyType[]>>('/property-types');
    return res.data.data;
  },
};

// ─── Locations / Suggestions ──────────────────────────────────────────────────

export const locationsService = {
  async getSuggestions(query: string, limit = 8): Promise<{ id: string; label: string; latitude?: number; longitude?: number }[]> {
    const res = await api.get<ApiResponse<{ id: string; label: string; latitude?: number; longitude?: number }[]>>(
      `/locations/suggestions?query=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return res.data.data;
  },
};
