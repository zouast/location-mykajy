import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, PropertyStatus, ListingStatus, VisitStatus, RentalStatus, SaleStatus, CommissionStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import {
  QueryAgentListingsDto,
  QueryAgentPropertiesDto,
} from './dto/query-agent-items.dto';
import {
  AgentDetailDto,
  AgentListingItemDto,
  AgentPropertyItemDto,
} from './dto/agent-response.dto';
import { AgencyResponseDto } from '../agencies/dto/agency-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { omitPassword } from '../auth/utils/omit-password.util';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import {
  AgentDashboardStatsDto,
  AgentClientDto,
  AgentTransactionDto,
  AgentCommissionDto,
} from './dto/agent-dashboard.dto';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAgentContext(user: AuthenticatedUser) {
    const isAgencyAdmin = user.role === Role.AGENCY_ADMIN || user.role === Role.ADMIN;
    
    // Find agent record
    let agent = await this.prisma.agent.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        agency: true,
      },
    });

    if (!agent) {
      if (isAgencyAdmin) {
        // If user is AGENCY_ADMIN but doesn't have an Agent profile yet, let's look for agency where they might belong or create
        const anyAgency = await this.prisma.agency.findFirst({
          orderBy: { createdAt: 'asc' },
        });
        if (anyAgency) {
          agent = await this.prisma.agent.create({
            data: {
              userId: user.id,
              agencyId: anyAgency.id,
              title: "Directeur d'Agence",
            },
            include: {
              user: true,
              agency: true,
            },
          });
        }
      }
    }

    if (!agent) {
      throw new ForbiddenException(
        "Vous ne disposez pas d'un profil d'agent immobilier ou de directeur d'agence",
      );
    }

    return { agent, isAgencyAdmin, agencyId: agent.agencyId };
  }

  async getMyProfile(userId: string): Promise<AgentDetailDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { userId },
      include: {
        user: true,
        agency: true,
      },
    });

    if (!agent) {
      throw new ForbiddenException("Vous ne disposez pas d'un profil d'agent immobilier");
    }

    return {
      ...agent,
      user: omitPassword(agent.user),
    };
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateAgentProfileDto,
  ): Promise<AgentDetailDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { userId },
    });

    if (!agent) {
      throw new ForbiddenException("Vous ne disposez pas d'un profil d'agent immobilier");
    }

    const updated = await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.licenseNumber !== undefined && {
          licenseNumber: dto.licenseNumber,
        }),
        ...(dto.biography !== undefined && { biography: dto.biography }),
        ...(dto.specialties !== undefined && { specialties: dto.specialties }),
        ...(dto.yearsExperience !== undefined && {
          yearsExperience: dto.yearsExperience,
        }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
      include: {
        user: true,
        agency: true,
      },
    });

    return {
      ...updated,
      user: omitPassword(updated.user),
    };
  }

  async getMyAgency(userId: string): Promise<AgencyResponseDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { userId },
      include: { agency: true },
    });

    if (!agent?.agency || agent.agency.deletedAt) {
      throw new NotFoundException('Votre agence de rattachement est introuvable');
    }

    return agent.agency;
  }

  async getMyProperties(
    userId: string,
    query: QueryAgentPropertiesDto,
  ): Promise<PaginatedResult<AgentPropertyItemDto>> {
    const agent = await this.prisma.agent.findUnique({ where: { userId } });
    if (!agent) throw new ForbiddenException("Profil d'agent introuvable");

    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      agentId: agent.id,
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { city: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: properties,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getMyListings(
    userId: string,
    query: QueryAgentListingsDto,
  ): Promise<PaginatedResult<AgentListingItemDto>> {
    const agent = await this.prisma.agent.findUnique({ where: { userId } });
    if (!agent) throw new ForbiddenException("Profil d'agent introuvable");

    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      property: {
        agentId: agent.id,
      },
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        include: {
          price: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: listings.map((l) => ({
        id: l.id,
        propertyId: l.propertyId,
        transactionType: l.transactionType,
        status: l.status,
        title: l.title,
        price: l.price?.price,
        viewsCount: l.viewsCount,
        contactCount: l.contactCount,
        createdAt: l.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── AGENT / AGENCY_ADMIN DASHBOARD & ADVANCED FEATURES ──────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Statistiques complètes pour le Dashboard (différenciées selon AGENT / AGENCY_ADMIN)
   */
  async getDashboardStats(user: AuthenticatedUser): Promise<AgentDashboardStatsDto> {
    const { agent, isAgencyAdmin, agencyId } = await this.getAgentContext(user);

    // Filter condition: Agency-wide vs Agent-personal
    const propertyWhere: Prisma.PropertyWhereInput = isAgencyAdmin
      ? { agencyId, deletedAt: null }
      : { agentId: agent.id, deletedAt: null };

    const listingWhere: Prisma.ListingWhereInput = isAgencyAdmin
      ? { property: { agencyId }, deletedAt: null }
      : { property: { agentId: agent.id }, deletedAt: null };

    const inquiryWhere: Prisma.InquiryWhereInput = isAgencyAdmin
      ? { listing: { property: { agencyId } } }
      : { OR: [{ agentId: agent.id }, { listing: { property: { agentId: agent.id } }] };

    const visitWhere: Prisma.VisitWhereInput = isAgencyAdmin
      ? { listing: { property: { agencyId } } }
      : { OR: [{ agentId: agent.id }, { listing: { property: { agentId: agent.id } }] };

    const saleWhere: Prisma.SaleWhereInput = isAgencyAdmin
      ? { listing: { property: { agencyId } } }
      : { agentId: agent.id };

    const rentalWhere: Prisma.RentalWhereInput = isAgencyAdmin
      ? { listing: { property: { agencyId } } }
      : { agentId: agent.id };

    const commissionWhere: Prisma.CommissionWhereInput = isAgencyAdmin
      ? { agencyId }
      : { agentId: agent.id };

    const [
      totalProperties,
      allListings,
      totalInquiries,
      pendingInquiries,
      allVisits,
      allSales,
      allRentals,
      allCommissions,
      teamMembersCount,
      recentInquiriesRaw,
      recentVisitsRaw,
    ] = await Promise.all([
      this.prisma.property.count({ where: propertyWhere }),
      this.prisma.listing.findMany({
        where: listingWhere,
        select: { status: true, title: true, id: true },
      }),
      this.prisma.inquiry.count({ where: inquiryWhere }),
      this.prisma.inquiry.count({ where: { ...inquiryWhere, status: 'NEW' } }),
      this.prisma.visit.findMany({
        where: visitWhere,
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          listing: { select: { title: true } },
        },
      }),
      this.prisma.sale.findMany({
        where: saleWhere,
        include: {
          buyer: { select: { firstName: true, lastName: true, email: true } },
          listing: { select: { title: true } },
        },
      }),
      this.prisma.rental.findMany({
        where: rentalWhere,
        include: {
          tenant: { select: { firstName: true, lastName: true, email: true } },
          listing: { select: { title: true } },
        },
      }),
      this.prisma.commission.findMany({
        where: commissionWhere,
        select: { amount: true, status: true },
      }),
      this.prisma.agent.count({ where: { agencyId } }),
      this.prisma.inquiry.findMany({
        where: inquiryWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          listing: { select: { title: true } },
        },
      }),
      this.prisma.visit.findMany({
        where: {
          ...visitWhere,
          scheduledAt: { gte: new Date() },
        },
        take: 5,
        orderBy: { scheduledAt: 'asc' },
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          listing: { select: { title: true } },
        },
      }),
    ]);

    const activeListings = allListings.filter((l) => l.status === ListingStatus.ACTIVE).length;
    const draftListings = allListings.filter((l) => l.status === ListingStatus.DRAFT).length;

    const totalVisits = allVisits.length;
    const now = new Date();
    const upcomingVisits = allVisits.filter(
      (v) =>
        new Date(v.scheduledAt) >= now &&
        (v.status === VisitStatus.REQUESTED || v.status === VisitStatus.CONFIRMED),
    ).length;

    const totalSales = allSales.filter((s) => s.status === SaleStatus.COMPLETED).length;
    const totalRentals = allRentals.filter((r) => r.status === RentalStatus.ACTIVE).length;

    const totalCommissionsEarned = allCommissions
      .filter((c) => c.status === CommissionStatus.PAID)
      .reduce((sum, c) => sum + c.amount, 0);

    const pendingCommissions = allCommissions
      .filter((c) => c.status === CommissionStatus.PENDING || c.status === CommissionStatus.INVOICED)
      .reduce((sum, c) => sum + c.amount, 0);

    // Calculate unique clients
    const clientIds = new Set<string>();
    allVisits.forEach((v) => v.clientId && clientIds.add(v.clientId));
    allSales.forEach((s) => s.buyerId && clientIds.add(s.buyerId));
    allRentals.forEach((r) => r.tenantId && clientIds.add(r.tenantId));
    const totalClients = clientIds.size;

    const recentInquiries = recentInquiriesRaw.map((inq) => ({
      id: inq.id,
      subject: inq.subject,
      name:
        inq.name ||
        [inq.client?.firstName, inq.client?.lastName].filter(Boolean).join(' ') ||
        'Client potentiel',
      email: inq.email || inq.client?.email || null,
      status: inq.status,
      createdAt: inq.createdAt,
      listingTitle: inq.listing?.title || 'Bien immobilier',
    }));

    const recentVisits = recentVisitsRaw.map((v) => ({
      id: v.id,
      scheduledAt: v.scheduledAt,
      type: v.type,
      status: v.status,
      clientName:
        [v.client?.firstName, v.client?.lastName].filter(Boolean).join(' ') ||
        v.client?.email ||
        'Visiteur',
      listingTitle: v.listing?.title || 'Bien immobilier',
    }));

    const recentTransactions: AgentDashboardStatsDto['recentTransactions'] = [
      ...allSales.slice(0, 3).map((s) => ({
        id: s.id,
        type: 'SALE' as const,
        title: s.listing?.title || 'Vente immobilière',
        amount: s.agreedPrice || s.offerPrice,
        status: s.status,
        date: s.createdAt,
        clientName:
          [s.buyer?.firstName, s.buyer?.lastName].filter(Boolean).join(' ') || s.buyer?.email || 'Acheteur',
      })),
      ...allRentals.slice(0, 3).map((r) => ({
        id: r.id,
        type: 'RENTAL' as const,
        title: r.listing?.title || 'Location immobilière',
        amount: r.monthlyRent,
        status: r.status,
        date: r.createdAt,
        clientName:
          [r.tenant?.firstName, r.tenant?.lastName].filter(Boolean).join(' ') || r.tenant?.email || 'Locataire',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return {
      isAgencyAdmin,
      agencyName: agent.agency?.name,
      totalProperties,
      activeListings,
      draftListings,
      totalInquiries,
      pendingInquiries,
      totalVisits,
      upcomingVisits,
      totalClients,
      totalSales,
      totalRentals,
      totalCommissionsEarned,
      pendingCommissions,
      teamMembersCount,
      recentInquiries,
      recentVisits,
      recentTransactions,
    };
  }

  /**
   * CRM / Liste des clients suivis par l'agent ou toute l'agence
   */
  async getClients(
    user: AuthenticatedUser,
    page = 1,
    limit = 15,
    search?: string,
  ): Promise<{ items: AgentClientDto[]; total: number; page: number; totalPages: number }> {
    const { agent, isAgencyAdmin, agencyId } = await this.getAgentContext(user);

    // Gather clients from Visits, Sales, Rentals and Inquiries
    const visitWhere: Prisma.VisitWhereInput = isAgencyAdmin
      ? { listing: { property: { agencyId } } }
      : { OR: [{ agentId: agent.id }, { listing: { property: { agentId: agent.id } }] };

    const saleWhere: Prisma.SaleWhereInput = isAgencyAdmin
      ? { listing: { property: { agencyId } } }
      : { agentId: agent.id };

    const rentalWhere: Prisma.RentalWhereInput = isAgencyAdmin
      ? { listing: { property: { agencyId } } }
      : { agentId: agent.id };

    const [visits, sales, rentals] = await Promise.all([
      this.prisma.visit.findMany({
        where: visitWhere,
        include: {
          client: true,
          agent: { include: { user: true } },
        },
      }),
      this.prisma.sale.findMany({
        where: saleWhere,
        include: {
          buyer: true,
          agent: { include: { user: true } },
        },
      }),
      this.prisma.rental.findMany({
        where: rentalWhere,
        include: {
          tenant: true,
          agent: { include: { user: true } },
        },
      }),
    ]);

    const clientsMap = new Map<string, AgentClientDto>();

    visits.forEach((v) => {
      if (!v.client) return;
      const existing = clientsMap.get(v.clientId);
      const assignedName = v.agent?.user
        ? `${v.agent.user.firstName || ''} ${v.agent.user.lastName || ''}`.trim()
        : undefined;

      if (existing) {
        existing.interactionsCount += 1;
        if (!existing.lastInteraction || new Date(v.scheduledAt) > new Date(existing.lastInteraction)) {
          existing.lastInteraction = v.scheduledAt;
        }
      } else {
        clientsMap.set(v.clientId, {
          id: v.clientId,
          name: `${v.client.firstName || ''} ${v.client.lastName || ''}`.trim() || v.client.email,
          email: v.client.email,
          phone: v.client.phone || undefined,
          category: 'PROSPECT',
          lastInteraction: v.scheduledAt,
          interactionsCount: 1,
          assignedAgentName: assignedName,
        });
      }
    });

    sales.forEach((s) => {
      if (!s.buyer) return;
      const existing = clientsMap.get(s.buyerId);
      if (existing) {
        existing.category = 'ACHETEUR';
        existing.interactionsCount += 1;
      } else {
        clientsMap.set(s.buyerId, {
          id: s.buyerId,
          name: `${s.buyer.firstName || ''} ${s.buyer.lastName || ''}`.trim() || s.buyer.email,
          email: s.buyer.email,
          phone: s.buyer.phone || undefined,
          category: 'ACHETEUR',
          lastInteraction: s.createdAt,
          interactionsCount: 1,
        });
      }
    });

    rentals.forEach((r) => {
      if (!r.tenant) return;
      const existing = clientsMap.get(r.tenantId);
      if (existing) {
        existing.category = 'LOCATAIRE';
        existing.interactionsCount += 1;
      } else {
        clientsMap.set(r.tenantId, {
          id: r.tenantId,
          name: `${r.tenant.firstName || ''} ${r.tenant.lastName || ''}`.trim() || r.tenant.email,
          email: r.tenant.email,
          phone: r.tenant.phone || undefined,
          category: 'LOCATAIRE',
          lastInteraction: r.createdAt,
          interactionsCount: 1,
        });
      }
    });

    let clientList = Array.from(clientsMap.values());

    if (search) {
      const q = search.toLowerCase();
      clientList = clientList.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)),
      );
    }

    const total = clientList.length;
    const skip = (page - 1) * limit;
    const paginatedItems = clientList.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Transactions immobilières (Ventes & Baux locatifs)
   */
  async getTransactions(
    user: AuthenticatedUser,
    page = 1,
    limit = 15,
    type?: 'SALE' | 'RENTAL',
  ): Promise<{ items: AgentTransactionDto[]; total: number; page: number; totalPages: number }> {
    const { agent, isAgencyAdmin, agencyId } = await this.getAgentContext(user);

    const saleWhere: Prisma.SaleWhereInput = isAgencyAdmin
      ? { listing: { property: { agencyId } } }
      : { agentId: agent.id };

    const rentalWhere: Prisma.RentalWhereInput = isAgencyAdmin
      ? { listing: { property: { agencyId } } }
      : { agentId: agent.id };

    const [sales, rentals] = await Promise.all([
      type === 'RENTAL'
        ? []
        : this.prisma.sale.findMany({
            where: saleWhere,
            orderBy: { createdAt: 'desc' },
            include: {
              listing: { select: { title: true, propertyId: true } },
              buyer: { select: { firstName: true, lastName: true, email: true } },
              agent: { include: { user: { select: { firstName: true, lastName: true } } } },
              commissions: { select: { amount: true, status: true } },
            },
          }),
      type === 'SALE'
        ? []
        : this.prisma.rental.findMany({
            where: rentalWhere,
            orderBy: { createdAt: 'desc' },
            include: {
              listing: { select: { title: true, propertyId: true } },
              tenant: { select: { firstName: true, lastName: true, email: true } },
              agent: { include: { user: { select: { firstName: true, lastName: true } } } },
              commissions: { select: { amount: true, status: true } },
            },
          }),
    ]);

    const transactions: AgentTransactionDto[] = [
      ...sales.map((s) => ({
        id: s.id,
        type: 'SALE' as const,
        title: s.listing?.title || 'Vente de bien',
        propertyId: s.listing?.propertyId || '',
        status: s.status,
        amount: s.agreedPrice || s.offerPrice,
        commissionAmount: s.commissions?.[0]?.amount,
        commissionStatus: s.commissions?.[0]?.status,
        clientName:
          [s.buyer?.firstName, s.buyer?.lastName].filter(Boolean).join(' ') || s.buyer?.email || 'Acheteur',
        agentName: s.agent?.user
          ? `${s.agent.user.firstName || ''} ${s.agent.user.lastName || ''}`.trim()
          : undefined,
        createdAt: s.createdAt,
      })),
      ...rentals.map((r) => ({
        id: r.id,
        type: 'RENTAL' as const,
        title: r.listing?.title || 'Location immobilière',
        propertyId: r.listing?.propertyId || '',
        status: r.status,
        amount: r.monthlyRent,
        commissionAmount: r.commissions?.[0]?.amount,
        commissionStatus: r.commissions?.[0]?.status,
        clientName:
          [r.tenant?.firstName, r.tenant?.lastName].filter(Boolean).join(' ') || r.tenant?.email || 'Locataire',
        agentName: r.agent?.user
          ? `${r.agent.user.firstName || ''} ${r.agent.user.lastName || ''}`.trim()
          : undefined,
        createdAt: r.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = transactions.length;
    const skip = (page - 1) * limit;
    const paginated = transactions.slice(skip, skip + limit);

    return {
      items: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Commissions & Honoraires perçus
   */
  async getCommissions(
    user: AuthenticatedUser,
    page = 1,
    limit = 15,
    status?: CommissionStatus,
  ): Promise<{ items: AgentCommissionDto[]; total: number; page: number; totalPages: number }> {
    const { agent, isAgencyAdmin, agencyId } = await this.getAgentContext(user);

    const where: Prisma.CommissionWhereInput = {
      ...(isAgencyAdmin ? { agencyId } : { agentId: agent.id }),
      ...(status && { status }),
    };

    const skip = (page - 1) * limit;

    const [commissions, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { include: { user: { select: { firstName: true, lastName: true } } } },
          sale: { include: { listing: { select: { title: true } } } },
          rental: { include: { listing: { select: { title: true } } } },
        },
      }),
      this.prisma.commission.count({ where }),
    ]);

    const items: AgentCommissionDto[] = commissions.map((c) => ({
      id: c.id,
      amount: c.amount,
      percentage: c.percentage || undefined,
      currency: c.currency,
      status: c.status,
      invoiceNumber: c.invoiceNumber || undefined,
      paidAt: c.paidAt || undefined,
      createdAt: c.createdAt,
      agentName: c.agent?.user
        ? `${c.agent.user.firstName || ''} ${c.agent.user.lastName || ''}`.trim()
        : undefined,
      transactionTitle: c.sale?.listing?.title || c.rental?.listing?.title || 'Transaction immobilière',
      transactionType: c.sale ? ('SALE' as const) : c.rental ? ('RENTAL' as const) : undefined,
    }));

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
