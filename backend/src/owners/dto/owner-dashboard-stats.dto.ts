export class OwnerDashboardStatsDto {
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
  recentInquiries: Array<{
    id: string;
    subject: string | null;
    name: string | null;
    email: string | null;
    status: string;
    createdAt: Date;
    listingTitle: string;
  }>;
  recentVisits: Array<{
    id: string;
    scheduledAt: Date;
    type: string;
    status: string;
    clientName: string;
    listingTitle: string;
  }>;
}
