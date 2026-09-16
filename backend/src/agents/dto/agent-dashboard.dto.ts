import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionStatus } from '@prisma/client';

export class AgentDashboardStatsDto {
  @ApiProperty()
  isAgencyAdmin: boolean;

  @ApiPropertyOptional()
  agencyName?: string;

  @ApiProperty()
  totalProperties: number;

  @ApiProperty()
  activeListings: number;

  @ApiProperty()
  draftListings: number;

  @ApiProperty()
  totalInquiries: number;

  @ApiProperty()
  pendingInquiries: number;

  @ApiProperty()
  totalVisits: number;

  @ApiProperty()
  upcomingVisits: number;

  @ApiProperty()
  totalClients: number;

  @ApiProperty()
  totalSales: number;

  @ApiProperty()
  totalRentals: number;

  @ApiProperty()
  totalCommissionsEarned: number;

  @ApiProperty()
  pendingCommissions: number;

  @ApiProperty()
  teamMembersCount: number;

  @ApiProperty()
  recentInquiries: Array<{
    id: string;
    subject: string | null;
    name: string;
    email: string | null;
    status: string;
    createdAt: Date;
    listingTitle: string;
  }>;

  @ApiProperty()
  recentVisits: Array<{
    id: string;
    scheduledAt: Date;
    type: string;
    status: string;
    clientName: string;
    listingTitle: string;
  }>;

  @ApiProperty()
  recentTransactions: Array<{
    id: string;
    type: 'SALE' | 'RENTAL';
    title: string;
    amount: number;
    status: string;
    date: Date;
    clientName: string;
  }>;
}

export class AgentClientDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  lastInteraction: Date;

  @ApiProperty()
  interactionsCount: number;

  @ApiPropertyOptional()
  assignedAgentName?: string;
}

export class AgentTransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['SALE', 'RENTAL'] })
  type: 'SALE' | 'RENTAL';

  @ApiProperty()
  title: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  commissionAmount?: number;

  @ApiPropertyOptional()
  commissionStatus?: CommissionStatus;

  @ApiProperty()
  clientName: string;

  @ApiPropertyOptional()
  agentName?: string;

  @ApiProperty()
  createdAt: Date;
}

export class AgentCommissionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  percentage?: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: CommissionStatus;

  @ApiPropertyOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  agentName?: string;

  @ApiPropertyOptional()
  transactionTitle?: string;

  @ApiPropertyOptional({ enum: ['SALE', 'RENTAL'] })
  transactionType?: 'SALE' | 'RENTAL';
}
