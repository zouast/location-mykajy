// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'AGENCY_ADMIN' | 'AGENT' | 'OWNER' | 'CLIENT';
export type TransactionType = 'SALE' | 'RENT';
export type PropertyStatus = 'AVAILABLE' | 'UNDER_OFFER' | 'RENTED' | 'SOLD' | 'UNDER_RENOVATION' | 'ARCHIVED';
export type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';
export type MediaType = 'IMAGE' | 'VIDEO' | 'VIRTUAL_TOUR' | 'FLOOR_PLAN' | 'DOCUMENT';
export type InquiryStatus = 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED';

// ─── Inquiries ───────────────────────────────────────────────────────────────

export interface Inquiry {
  id: string;
  listingId: string;
  clientId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  subject: string;
  message: string;
  status: InquiryStatus;
  response?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
  listing?: {
    id: string;
    title: string;
    transactionType: string;
    city?: string;
    primaryPhotoUrl?: string;
    price?: number;
  } | null;
}

export interface CreateInquiryPayload {
  listingId: string;
  subject: string;
  message: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdateInquiryStatusPayload {
  status: InquiryStatus;
  response?: string;
}

// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  role: Role;
  isActive: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface MessageResponse {
  message: string;
}

// ─── Favorites & Saved Searches ──────────────────────────────────────────────

export interface FavoriteItem {
  id: string;
  listingId: string;
  createdAt: string;
  listing: ListingSearchResult;
}

export interface FavoritesResponse {
  items: FavoriteItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  transactionType?: TransactionType | null;
  city?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  minRooms?: number | null;
  propertyTypeId?: string | null;
  isActive: boolean;
  lastNotifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  matchedCount?: number;
}

export interface CreateSavedSearchPayload {
  name: string;
  transactionType?: TransactionType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minRooms?: number;
  propertyTypeId?: string;
  isActive?: boolean;
}

export interface UpdateSavedSearchPayload extends Partial<CreateSavedSearchPayload> {}

// ─── Agency ──────────────────────────────────────────────────────────────────

export interface Agency {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  isActive: boolean;
  agentCount?: number;
  propertyCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Property Type ────────────────────────────────────────────────────────────

export interface PropertyType {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

// ─── Search API — Listing enrichi (GET /listings) ────────────────────────────

export interface SearchResultLocation {
  city: string;
  neighborhood?: string;
  state?: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  formatted?: string;
}

export interface SearchResultPrice {
  price: number;
  currency: string;
  formatted?: string;
  pricePerSqm?: number;
  pricePerSqmFormatted?: string;
  isNegotiable?: boolean;
  charges?: number;
  deposit?: number;
  agencyFees?: number;
}

export interface SearchResultProperty {
  id: string;
  title: string;
  typeSlug?: string;
  typeName?: string;
  area: number;
  landArea?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  isFurnished?: boolean;
  hasPool?: boolean;
  hasGarden?: boolean;
  hasElevator?: boolean;
  hasGarage?: boolean;
  hasBalcony?: boolean;
  energyRating?: string;
  ghgRating?: string;
}

export interface SearchResultPrimaryPhoto {
  url: string;
  title?: string;
}

export interface ListingSearchResult {
  id: string;
  transactionType: TransactionType;
  status: ListingStatus;
  title?: string;
  slug?: string;
  descriptionExcerpt?: string;
  isFeatured: boolean;
  viewsCount: number;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  distanceKm?: number;
  price: SearchResultPrice;
  property: SearchResultProperty;
  location: SearchResultLocation;
  primaryPhoto?: SearchResultPrimaryPhoto;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  appliedFilters?: Record<string, unknown>;
}

export interface ListingSearchResponse {
  items: ListingSearchResult[];
  meta: PaginationMeta;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode?: number;
  timestamp?: string;
  data: T;
}

// ─── Filtres de recherche ─────────────────────────────────────────────────────

export interface ListingSearchFilters {
  transactionType?: TransactionType;
  propertyType?: string;
  city?: string;
  neighborhood?: string;
  commune?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minBedrooms?: number;
  minRooms?: number;
  minBathrooms?: number;
  hasParking?: boolean;
  hasPool?: boolean;
  hasGarden?: boolean;
  isFurnished?: boolean;
  hasElevator?: boolean;
  hasGarage?: boolean;
  hasBalcony?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sortBy?: 'price' | 'date' | 'area' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  q?: string;
  page?: number;
  limit?: number;
}
