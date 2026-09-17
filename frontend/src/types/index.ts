export type Role = 'ADMIN' | 'AGENCY_ADMIN' | 'AGENT' | 'OWNER' | 'CLIENT' | 'LOCATAIRE' | 'PROPRIETAIRE';
export type TransactionType = 'SALE' | 'RENT';
export type PropertyStatus = 'AVAILABLE' | 'UNDER_OFFER' | 'RENTED' | 'SOLD' | 'UNDER_RENOVATION' | 'ARCHIVED';
export type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';
export type MediaType = 'IMAGE' | 'VIDEO' | 'VIRTUAL_TOUR' | 'FLOOR_PLAN' | 'DOCUMENT';
export type InquiryStatus = 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED';
export type VisitStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type VisitType = 'IN_PERSON' | 'VIRTUAL';
export type ApplicationStatus =
  | 'APPLICATION'
  | 'DOCUMENT_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONTRACT_PENDING'
  | 'ACTIVE'
  | 'TERMINATED'
  | 'CANCELLED';
export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'RENEWED'
  | 'TERMINATED'
  | 'EXPIRED'
  | 'CANCELLED';
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'OVERDUE';

export type PaymentType =
  | 'RENT'
  | 'DEPOSIT'
  | 'COMMISSION'
  | 'DOWN_PAYMENT'
  | 'SALE_PAYMENT'
  | 'OTHER_FEES';

export type PaymentMethod =
  | 'STRIPE'
  | 'CARD'
  | 'MOBILE_MONEY'
  | 'BANK_TRANSFER'
  | 'MANUAL'
  | 'CASH'
  | 'CHECK'
  | 'OTHER';

// ─── Rental & Tenant Application ─────────────────────────────────────────────

export interface RentalDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  isVerified: boolean;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface RentScheduleItem {
  id: string;
  period: string;
  dueDate: string;
  rentAmount: number;
  chargesAmount: number;
  totalAmount: number;
  status: PaymentStatus;
  paidAt?: string | null;
  receiptUrl?: string | null;
}

export interface RentalContract {
  id: string;
  contractNumber: string;
  status: ContractStatus;
  signedByTenant: boolean;
  signedByLandlord: boolean;
  signedAt?: string | null;
  terms?: string | null;
  documentUrl?: string | null;
}

export interface RentalDetails {
  id: string;
  listingId: string;
  monthlyRent: number;
  deposit?: number | null;
  charges?: number | null;
  status: string;
  startDate: string;
  endDate?: string | null;
  contract?: RentalContract | null;
  schedules?: RentScheduleItem[];
}

export interface RentalApplication {
  id: string;
  listingId: string;
  tenantId: string;
  agentId?: string | null;
  landlordId: string;
  status: ApplicationStatus;
  monthlyIncome: number;
  employmentStatus: string;
  employer?: string | null;
  guarantorName?: string | null;
  guarantorIncome?: number | null;
  comments?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  approvedAt?: string | null;
  rentalId?: string | null;
  createdAt: string;
  updatedAt: string;
  documents: RentalDocument[];
  tenant?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
  listing?: {
    id: string;
    title: string;
    city?: string;
    primaryPhotoUrl?: string;
    monthlyRent?: number;
    charges?: number;
    deposit?: number;
  } | null;
  rental?: RentalDetails | null;
}

export interface CreateRentalApplicationPayload {
  listingId: string;
  monthlyIncome: number;
  employmentStatus: string;
  employer?: string;
  guarantorName?: string;
  guarantorIncome?: number;
  comments?: string;
  documents?: Array<{
    type: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
  }>;
}

export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus;
  rejectionReason?: string;
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  charges?: number;
  deposit?: number;
  terms?: string;
}

// ─── Visits ──────────────────────────────────────────────────────────────────

export interface Visit {
  id: string;
  listingId: string;
  clientId: string;
  agentId?: string | null;
  scheduledAt: string;
  duration: number;
  type: VisitType;
  status: VisitStatus;
  clientNotes?: string | null;
  agentNotes?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
  agent?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
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

export interface CreateVisitPayload {
  listingId: string;
  scheduledAt: string;
  duration?: number;
  type?: VisitType;
  clientNotes?: string;
}

export interface UpdateVisitStatusPayload {
  status: VisitStatus;
  agentNotes?: string;
  cancelReason?: string;
}

export interface AvailabilitySlot {
  time: string;
  isAvailable: boolean;
  reason?: string;
}

export interface DayAvailability {
  date: string;
  slots: AvailabilitySlot[];
}

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
  status?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
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

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: Partial<User>;
  };
}

export interface MessageResponse {
  message: string;
  success?: boolean;
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

// ─── Owner Dashboard Types ───────────────────────────────────────────────────

export interface OwnerDashboardStats {
  totalProperties: number;
  activeListings: number;
  draftListings: number;
  soldProperties: number;
  rentedProperties: number;
  totalInquiries: number;
  pendingInquiries: number;
  totalVisits: number;
  upcomingVisits: number;
  totalViews: number;
  monthlyRentalIncome: number;
  recentInquiries?: Array<{
    id: string;
    subject: string;
    name?: string | null;
    email?: string | null;
    status: string;
    createdAt: string;
    listingTitle: string;
  }>;
  recentVisits?: Array<{
    id: string;
    scheduledAt: string;
    type: string;
    status: string;
    clientName: string;
    listingTitle: string;
  }>;
}

export interface OwnerProperty {
  id: string;
  title: string;
  description: string;
  status: PropertyStatus;
  yearBuilt?: number | null;
  floor?: number | null;
  totalFloors?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  rooms?: number | null;
  area: number;
  landArea?: number | null;
  parkingSpaces?: number | null;
  energyRating?: string | null;
  ghgRating?: string | null;
  isFurnished: boolean;
  hasElevator: boolean;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  hasGarage: boolean;
  createdAt: string;
  updatedAt: string;
  type?: {
    id: string;
    name: string;
    slug: string;
  };
  location?: {
    id: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
  media?: Array<{
    id: string;
    url: string;
    type: string;
    isPrimary: boolean;
  }>;
  listings?: Array<{
    id: string;
    title?: string | null;
    status: ListingStatus;
    transactionType: TransactionType;
    price?: {
      price: number;
      currency: string;
      charges?: number | null;
    } | null;
  }>;
}

export interface OwnerListing {
  id: string;
  title?: string | null;
  slug?: string | null;
  status: ListingStatus;
  transactionType: TransactionType;
  isFeatured: boolean;
  viewsCount: number;
  createdAt: string;
  publishedAt?: string | null;
  price?: {
    price: number;
    currency: string;
    charges?: number | null;
    deposit?: number | null;
  } | null;
  property: {
    id: string;
    title: string;
    area: number;
    rooms?: number | null;
    bedrooms?: number | null;
    type?: {
      id: string;
      name: string;
    } | null;
    location?: {
      id: string;
      address: string;
      city: string;
      zipCode: string;
    } | null;
    media?: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
    }>;
  };
  _count?: {
    inquiries: number;
    visits: number;
    favorites: number;
  };
}

// ─── Agent & Agency Admin Types ───────────────────────────────────────────────

export interface AgentDashboardStats {
  isAgencyAdmin: boolean;
  agencyName?: string;
  totalProperties: number;
  activeListings: number;
  draftListings: number;
  totalInquiries: number;
  pendingInquiries: number;
  totalVisits: number;
  upcomingVisits: number;
  totalClients: number;
  totalSales: number;
  totalRentals: number;
  totalCommissionsEarned: number;
  pendingCommissions: number;
  teamMembersCount: number;
  recentInquiries?: Array<{
    id: string;
    subject: string;
    name?: string | null;
    email?: string | null;
    status: string;
    createdAt: string;
    listingTitle: string;
  }>;
  recentVisits?: Array<{
    id: string;
    scheduledAt: string;
    type: string;
    status: string;
    clientName: string;
    listingTitle: string;
  }>;
  recentTransactions?: Array<{
    id: string;
    type: 'SALE' | 'RENTAL';
    title: string;
    amount: number;
    status: string;
    date: string;
    clientName: string;
  }>;
}

export interface AgentClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: 'ACHETEUR' | 'LOCATAIRE' | 'PROPRIETAIRE' | 'PROSPECT';
  lastInteraction?: string;
  interactionsCount: number;
  assignedAgentName?: string;
}

export interface AgentTransaction {
  id: string;
  type: 'SALE' | 'RENTAL';
  title: string;
  propertyId: string;
  status: string;
  amount: number;
  commissionAmount?: number;
  commissionStatus?: string;
  clientName: string;
  agentName?: string;
  createdAt: string;
}

export interface AgentCommission {
  id: string;
  amount: number;
  percentage?: number;
  currency: string;
  status: 'PENDING' | 'INVOICED' | 'PAID' | 'CANCELLED';
  invoiceNumber?: string;
  paidAt?: string;
  createdAt: string;
  agentName?: string;
  transactionTitle?: string;
  transactionType?: 'SALE' | 'RENTAL';
}

export interface AgencyTeamMember {
  id: string;
  userId: string;
  title?: string;
  licenseNumber?: string;
  biography?: string;
  specialties?: string[];
  yearsExperience?: number;
  isAvailable: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    role: string;
    isActive: boolean;
  };
  _count?: {
    properties: number;
    visits: number;
    inquiries: number;
    sales: number;
    rentals: number;
  };
}

// ─── Admin Dashboard Types ───────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalAgencies: number;
  totalProperties: number;
  totalListings: number;
  activeListings: number;
  totalSales: number;
  totalRentals: number;
  totalTransactionVolume: number;
  totalCommissions: number;
  platformRevenue: number;
  recentUsers?: Array<{
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
    createdAt: string;
    isActive: boolean;
  }>;
  recentTransactions?: Array<{
    id: string;
    type: 'SALE' | 'RENTAL';
    title: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  monthlyGrowth?: Array<{
    month: string;
    usersCount: number;
    listingsCount: number;
    salesVolume: number;
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminAgency {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  isVerified: boolean;
  isActive: boolean;
  agentsCount: number;
  propertiesCount: number;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
  description?: string | null;
  dueDate: string;
  paidAt?: string | null;
  userEmail: string;
  createdAt: string;
}

export interface AdminSettings {
  platformName: string;
  defaultCurrency: string;
  defaultCommissionRate: number;
  maintenanceMode: boolean;
  requireAgencyVerification: boolean;
  maxMediaPerListing: number;
  supportEmail: string;
  updatedAt: string;
}

// ─── Notifications ─────────────────────────────────────────────────────────

export type NotificationType =
  | 'NEW_INQUIRY'
  | 'VISIT_REQUESTED'
  | 'VISIT_CONFIRMED'
  | 'VISIT_CANCELLED'
  | 'LISTING_APPROVED'
  | 'LISTING_REJECTED'
  | 'NEW_MESSAGE'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'SAVED_SEARCH_MATCH'
  | 'VISIT_REQUEST'
  | 'MESSAGE_RECEIVED'
  | 'INQUIRY_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'CONTRACT_CREATED'
  | 'CONTRACT_EXPIRING'
  | 'LISTING_STATUS_CHANGE'
  | 'FAVORITE_PRICE_DROP'
  | 'SYSTEM';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  content: string;
  link?: string | null;
  metadata?: Record<string, any> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPagination {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

// ─── Messaging & Conversations ─────────────────────────────────────────────

export interface ChatParticipantUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  role?: Role;
  phone?: string | null;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  hasUnread: boolean;
  lastReadAt?: string | null;
  user: ChatParticipantUser;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  isEdited: boolean;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentType?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: ChatParticipantUser | null;
}

export interface ConversationListingSummary {
  id: string;
  title: string;
  transactionType: TransactionType;
  city?: string;
  price?: number;
  primaryPhotoUrl?: string | null;
}

export interface ConversationItem {
  id: string;
  subject?: string | null;
  listingId?: string | null;
  isArchived: boolean;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage | null;
  listing?: ConversationListingSummary | null;
}

export interface CreateConversationInput {
  recipientId: string;
  listingId?: string;
  subject?: string;
  initialMessage: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}

export interface SendMessageInput {
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}

// ─── Payment Transactions ──────────────────────────────────────────────────

export interface PaymentItem {
  id: string;
  userId: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  provider?: string | null;
  providerRef?: string | null;
  transactionRef?: string | null;
  description: string;
  dueDate: string;
  paidAt?: string | null;
  failedReason?: string | null;
  receiptUrl?: string | null;
  saleId?: string | null;
  rentalId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  rental?: {
    id: string;
    monthlyRent: number;
    listing?: { id: string; title?: string | null } | null;
  } | null;
  sale?: {
    id: string;
    offerPrice: number;
    listing?: { id: string; title?: string | null } | null;
  } | null;
}

export interface PaymentSessionResponse {
  payment: PaymentItem;
  session: {
    provider: 'STRIPE' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'MANUAL';
    providerRef: string;
    status: PaymentStatus;
    checkoutUrl?: string;
    qrCodeUrl?: string;
    ussdPromptCode?: string;
    instructions?: string;
  };
}

export interface InitiatePaymentInput {
  amount: number;
  currency?: string;
  type: PaymentType;
  method: PaymentMethod;
  provider?: 'STRIPE' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'MANUAL';
  description: string;
  saleId?: string;
  rentalId?: string;
  rentScheduleId?: string;
  commissionId?: string;
  returnUrl?: string;
  cancelUrl?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentInput {
  providerRef?: string;
  otpCode?: string;
  phoneNumber?: string;
  metadata?: Record<string, any>;
}






