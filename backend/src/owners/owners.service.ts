import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OwnerDashboardStatsDto } from './dto/owner-dashboard-stats.dto';
import { ListingStatus, PropertyStatus, RentalStatus, VisitStatus } from '@prisma/client';

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupérer ou initialiser le profil Owner pour l'utilisateur
   */
  async getOrCreateOwnerProfile(userId: string) {
    let owner = await this.prisma.owner.findUnique({ where: { userId } });
    if (!owner) {
      owner = await this.prisma.owner.create({
        data: {
          userId,
        },
      });
    }
    return owner;
  }

  /**
   * Récupérer les statistiques complètes du Dashboard Owner
   */
  async getDashboardStats(userId: string): Promise<OwnerDashboardStatsDto> {
    const owner = await this.getOrCreateOwnerProfile(userId);

    // 1. Biens du propriétaire
    const properties = await this.prisma.property.findMany({
      where: { ownerId: owner.id },
      include: {
        listings: {
          include: {
            price: true,
            inquiries: { select: { id: true, status: true, createdAt: true, subject: true, name: true, email: true } },
            visits: { select: { id: true, status: true, scheduledAt: true, type: true, client: true } },
          },
        },
        rentals: {
          where: { status: RentalStatus.ACTIVE },
          select: { monthlyRent: true },
        },
      },
    });

    const totalProperties = properties.length;
    const soldProperties = properties.filter((p) => p.status === PropertyStatus.SOLD).length;
    const rentedProperties = properties.filter((p) => p.status === PropertyStatus.RENTED).length;

    // 2. Annonces
    const allListings = properties.flatMap((p) => p.listings);
    const activeListings = allListings.filter((l) => l.status === ListingStatus.ACTIVE).length;
    const draftListings = allListings.filter((l) => l.status === ListingStatus.DRAFT).length;
    const totalViews = allListings.reduce((sum, l) => sum + (l.viewsCount || 0), 0);

    // 3. Demandes (Inquiries)
    const allInquiries = allListings.flatMap((l) =>
      l.inquiries.map((inq) => ({
        ...inq,
        listingTitle: l.title || 'Bien immobilier',
      })),
    );
    const totalInquiries = allInquiries.length;
    const pendingInquiries = allInquiries.filter((inq) => inq.status === 'NEW').length;

    // 4. Visites
    const allVisits = allListings.flatMap((l) =>
      l.visits.map((v) => ({
        ...v,
        listingTitle: l.title || 'Bien immobilier',
      })),
    );
    const totalVisits = allVisits.length;
    const now = new Date();
    const upcomingVisits = allVisits.filter(
      (v) =>
        new Date(v.scheduledAt) >= now &&
        (v.status === VisitStatus.REQUESTED || v.status === VisitStatus.CONFIRMED),
    ).length;

    // 5. Revenus locatifs mensuels cumulés
    const monthlyRentalIncome = properties.reduce((sum, p) => {
      const propRentalTotal = p.rentals.reduce((rSum, r) => rSum + r.monthlyRent, 0);
      return sum + propRentalTotal;
    }, 0);

    // 6. Activités récentes
    const recentInquiries = allInquiries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((inq) => ({
        id: inq.id,
        subject: inq.subject,
        name: inq.name,
        email: inq.email,
        status: inq.status,
        createdAt: inq.createdAt,
        listingTitle: inq.listingTitle,
      }));

    const recentVisits = allVisits
      .filter((v) => new Date(v.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5)
      .map((v) => ({
        id: v.id,
        scheduledAt: v.scheduledAt,
        type: v.type,
        status: v.status,
        clientName:
          [v.client?.firstName, v.client?.lastName].filter(Boolean).join(' ') ||
          v.client?.email ||
          'Visiteur',
        listingTitle: v.listingTitle,
      }));

    return {
      totalProperties,
      activeListings,
      draftListings,
      soldProperties,
      rentedProperties,
      totalInquiries,
      pendingInquiries,
      totalVisits,
      upcomingVisits,
      totalViews,
      monthlyRentalIncome,
      recentInquiries,
      recentVisits,
    };
  }

  /**
   * Lister le patrimoine du propriétaire avec annonces rattachées
   */
  async getMyProperties(userId: string, page = 1, limit = 12) {
    const owner = await this.getOrCreateOwnerProfile(userId);
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where: { ownerId: owner.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          type: true,
          location: true,
          media: { where: { isPrimary: true }, take: 1 },
          listings: {
            include: {
              price: true,
            },
          },
        },
      }),
      this.prisma.property.count({ where: { ownerId: owner.id } }),
    ]);

    return {
      items: properties,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Lister toutes les annonces de l'Owner
   */
  async getMyListings(userId: string, page = 1, limit = 12) {
    const owner = await this.getOrCreateOwnerProfile(userId);
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: {
          property: {
            ownerId: owner.id,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          price: true,
          property: {
            include: {
              type: true,
              location: true,
              media: { where: { isPrimary: true }, take: 1 },
            },
          },
          _count: {
            select: {
              inquiries: true,
              visits: true,
              favorites: true,
            },
          },
        },
      }),
      this.prisma.listing.count({
        where: {
          property: {
            ownerId: owner.id,
          },
        },
      }),
    ]);

    return {
      items: listings,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
