import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ListingStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';
import type { QueryListingsDto } from './dto/query-listings.dto';
import type {
  ListingResponseDto,
  PaginatedListingsResponseDto,
} from './dto/listing-response.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Règles de transition du workflow des annonces
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Matrice des transitions autorisées.
 *
 * Workflow principal :
 *   DRAFT → PENDING_REVIEW → ACTIVE → PAUSED → ACTIVE
 *                                    ↘ COMPLETED
 *                                    ↘ CANCELLED
 *
 * Restrictions métier :
 *   - OWNER / AGENT ne peuvent PAS passer directement DRAFT → ACTIVE/COMPLETED.
 *   - Seul ADMIN peut : valider (PENDING_REVIEW → ACTIVE), rejeter (PENDING_REVIEW → CANCELLED).
 *   - Seul ADMIN peut suspendre (ACTIVE → PAUSED depuis ADMIN) ou archiver (→ CANCELLED).
 */
const WORKFLOW_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  [ListingStatus.DRAFT]: [ListingStatus.PENDING_REVIEW],
  [ListingStatus.PENDING_REVIEW]: [
    ListingStatus.ACTIVE, // ADMIN validation
    ListingStatus.CANCELLED, // ADMIN rejection
    ListingStatus.DRAFT, // Retour en brouillon (ADMIN ou propriétaire)
  ],
  [ListingStatus.ACTIVE]: [
    ListingStatus.PAUSED, // OWNER/AGENT dépublication temporaire
    ListingStatus.COMPLETED, // Transaction finalisée (ADMIN)
    ListingStatus.CANCELLED, // ADMIN suspension/archivage
  ],
  [ListingStatus.PAUSED]: [
    ListingStatus.ACTIVE, // Republication
    ListingStatus.CANCELLED, // ADMIN archivage
  ],
  [ListingStatus.EXPIRED]: [
    ListingStatus.DRAFT, // Rééditer pour republier
    ListingStatus.CANCELLED, // ADMIN archivage
  ],
  [ListingStatus.COMPLETED]: [], // État terminal
  [ListingStatus.CANCELLED]: [], // État terminal
};

/**
 * Transitions réservées exclusivement aux ADMIN.
 */
const ADMIN_ONLY_TRANSITIONS: Partial<Record<ListingStatus, ListingStatus[]>> =
  {
    [ListingStatus.PENDING_REVIEW]: [
      ListingStatus.ACTIVE,
      ListingStatus.CANCELLED,
    ],
    [ListingStatus.ACTIVE]: [ListingStatus.COMPLETED, ListingStatus.CANCELLED],
    [ListingStatus.PAUSED]: [ListingStatus.CANCELLED],
    [ListingStatus.EXPIRED]: [ListingStatus.CANCELLED],
  };

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Vérification des droits d'accès sur une annonce
  // ─────────────────────────────────────────────────────────────────────────────

  private async checkListingAccess(
    listingId: string,
    user: AuthenticatedUser,
    requireOwnership = true,
  ): Promise<{
    id: string;
    status: ListingStatus;
    propertyId: string;
    property: any;
  }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        property: {
          select: { ownerId: true, agentId: true, agencyId: true },
        },
      },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException(`Annonce introuvable (id: ${listingId})`);
    }

    if (!requireOwnership || user.role === Role.ADMIN) {
      return listing;
    }

    if (user.role === Role.OWNER) {
      const ownerProfile = await this.prisma.owner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!ownerProfile || listing.property?.ownerId !== ownerProfile.id) {
        throw new ForbiddenException(
          'Vous ne pouvez gérer que vos propres annonces.',
        );
      }
    } else if (user.role === Role.AGENT) {
      const agentProfile = await this.prisma.agent.findUnique({
        where: { userId: user.id },
        select: { id: true, agencyId: true },
      });
      if (
        !agentProfile ||
        (listing.property?.agentId !== agentProfile.id &&
          listing.property?.agencyId !== agentProfile.agencyId)
      ) {
        throw new ForbiddenException(
          'Vous ne pouvez gérer que les annonces des biens qui vous sont affectés.',
        );
      }
    } else if (user.role === Role.AGENCY_ADMIN) {
      const agentProfile = await this.prisma.agent.findUnique({
        where: { userId: user.id },
        select: { agencyId: true },
      });
      if (
        !agentProfile ||
        listing.property?.agencyId !== agentProfile.agencyId
      ) {
        throw new ForbiddenException(
          'Vous ne pouvez gérer que les annonces de votre agence.',
        );
      }
    }

    return listing;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Validation des transitions de workflow
  // ─────────────────────────────────────────────────────────────────────────────

  private validateTransition(
    current: ListingStatus,
    next: ListingStatus,
    user: AuthenticatedUser,
  ): void {
    const allowed = WORKFLOW_TRANSITIONS[current] ?? [];

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transition interdite : ${current} → ${next}. ` +
          `Transitions autorisées depuis ${current} : ${allowed.join(', ') || 'aucune (état terminal)'}`,
      );
    }

    // Vérifier si la transition est réservée aux ADMIN
    const adminOnlyTargets = ADMIN_ONLY_TRANSITIONS[current] ?? [];
    if (adminOnlyTargets.includes(next) && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        `Seul un administrateur peut effectuer la transition ${current} → ${next}.`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Génération d'un slug URL-friendly
  // ─────────────────────────────────────────────────────────────────────────────

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 100) + `-${Date.now()}`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async create(
    user: AuthenticatedUser,
    dto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    // Vérification que le bien existe et est accessible
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        agentId: true,
        agencyId: true,
        area: true,
      },
    });

    if (!property) {
      throw new NotFoundException(
        `Bien immobilier introuvable (id: ${dto.propertyId})`,
      );
    }

    // Vérification des droits sur le bien
    if (user.role !== Role.ADMIN) {
      if (user.role === Role.OWNER) {
        const ownerProfile = await this.prisma.owner.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (!ownerProfile || property.ownerId !== ownerProfile.id) {
          throw new ForbiddenException(
            'Vous ne pouvez créer des annonces que pour vos propres biens.',
          );
        }
      } else if (user.role === Role.AGENT) {
        const agentProfile = await this.prisma.agent.findUnique({
          where: { userId: user.id },
          select: { id: true, agencyId: true },
        });
        if (
          !agentProfile ||
          (property.agentId !== agentProfile.id &&
            property.agencyId !== agentProfile.agencyId)
        ) {
          throw new ForbiddenException(
            'Vous ne pouvez créer des annonces que pour les biens qui vous sont affectés.',
          );
        }
      } else if (user.role === Role.AGENCY_ADMIN) {
        const agentProfile = await this.prisma.agent.findUnique({
          where: { userId: user.id },
          select: { agencyId: true },
        });
        if (!agentProfile || property.agencyId !== agentProfile.agencyId) {
          throw new ForbiddenException(
            'Vous ne pouvez créer des annonces que pour les biens de votre agence.',
          );
        }
      }
    }

    const title = dto.title ?? property.title;
    const slug = title ? this.generateSlug(title) : undefined;
    const pricePerSqm =
      dto.price && property.area ? dto.price / property.area : undefined;

    const listing = await this.prisma.listing.create({
      data: {
        propertyId: dto.propertyId,
        transactionType: dto.transactionType,
        status: ListingStatus.DRAFT,
        visibility: dto.visibility ?? 'PUBLIC',
        title: dto.title,
        description: dto.description,
        slug,
        isFeatured: dto.isFeatured ?? false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        price: {
          create: {
            price: dto.price,
            pricePerSqm,
            currency: dto.currency ?? 'EUR',
            isNegotiable: dto.isNegotiable ?? false,
            deposit: dto.deposit,
            agencyFees: dto.agencyFees,
            charges: dto.charges,
          },
        },
      },
      include: { price: true },
    });

    this.logger.log(
      `Listing created: id=${listing.id}, property=${dto.propertyId}, user=${user.id}`,
    );
    return this.toResponseDto(listing);
  }

  async findAll(
    dto: QueryListingsDto,
    user?: AuthenticatedUser,
  ): Promise<PaginatedListingsResponseDto> {
    const {
      page = 1,
      limit = 20,
      transactionType,
      status,
      city,
      neighborhood,
      minPrice,
      maxPrice,
      isFeatured,
      agencyId,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      deletedAt: null,
    };

    // Par défaut, les requêtes publiques ne voient que les annonces ACTIVE
    if (
      !user ||
      (user.role !== Role.ADMIN && user.role !== Role.AGENCY_ADMIN)
    ) {
      where.status = status ?? ListingStatus.ACTIVE;
    } else if (status) {
      where.status = status;
    }

    if (transactionType) where.transactionType = transactionType;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    if (city || neighborhood) {
      where.property = {
        location: {
          ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
          ...(neighborhood
            ? { neighborhood: { contains: neighborhood, mode: 'insensitive' } }
            : {}),
        },
      };
    }

    if (agencyId) {
      where.property = { ...(where.property as object), agencyId };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        price: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      };
    }

    const validSortFields = ['publishedAt', 'createdAt', 'viewsCount'];
    const orderField = validSortFields.includes(sortBy)
      ? sortBy
      : 'publishedAt';

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          orderField === 'publishedAt'
            ? [{ isFeatured: 'desc' }, { publishedAt: sortOrder }]
            : [{ [orderField]: sortOrder }],
        include: { price: true },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: listings.map(this.toResponseDto),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(
    id: string,
    user?: AuthenticatedUser,
  ): Promise<ListingResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { price: true },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException(`Annonce introuvable (id: ${id})`);
    }

    // Seuls les ADMIN voient les annonces non actives
    if (
      listing.status !== ListingStatus.ACTIVE &&
      (!user || user.role === Role.CLIENT)
    ) {
      throw new NotFoundException(`Annonce introuvable (id: ${id})`);
    }

    // Incrémentation du compteur de vues pour les annonces actives publiques
    if (listing.status === ListingStatus.ACTIVE) {
      await this.prisma.listing.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      });
    }

    return this.toResponseDto({
      ...listing,
      viewsCount: listing.viewsCount + 1,
    });
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateListingDto,
  ): Promise<ListingResponseDto> {
    const listing = await this.checkListingAccess(id, user);

    // On ne peut modifier qu'un brouillon ou une annonce pausée
    if (
      listing.status !== ListingStatus.DRAFT &&
      listing.status !== ListingStatus.PAUSED
    ) {
      throw new BadRequestException(
        `Seules les annonces en DRAFT ou PAUSED peuvent être modifiées directement. ` +
          `Statut actuel : ${listing.status}`,
      );
    }

    const {
      price,
      charges,
      deposit,
      agencyFees,
      isNegotiable,
      currency,
      ...listingFields
    } = dto;

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        ...(listingFields.title ? { title: listingFields.title } : {}),
        ...(listingFields.description
          ? { description: listingFields.description }
          : {}),
        ...(listingFields.isFeatured !== undefined
          ? { isFeatured: listingFields.isFeatured }
          : {}),
        ...(listingFields.visibility
          ? { visibility: listingFields.visibility }
          : {}),
        ...(listingFields.expiresAt
          ? { expiresAt: new Date(listingFields.expiresAt) }
          : {}),
        ...(price !== undefined || charges !== undefined
          ? {
              price: {
                update: {
                  ...(price !== undefined ? { price } : {}),
                  ...(charges !== undefined ? { charges } : {}),
                  ...(deposit !== undefined ? { deposit } : {}),
                  ...(agencyFees !== undefined ? { agencyFees } : {}),
                  ...(isNegotiable !== undefined ? { isNegotiable } : {}),
                  ...(currency ? { currency } : {}),
                },
              },
            }
          : {}),
      },
      include: { price: true },
    });

    return this.toResponseDto(updated);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Actions de Workflow
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Soumettre une annonce à la validation (DRAFT → PENDING_REVIEW).
   * Accessible à : OWNER, AGENT, AGENCY_ADMIN, ADMIN.
   */
  async submit(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.checkListingAccess(id, user);
    this.validateTransition(listing.status, ListingStatus.PENDING_REVIEW, user);

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.PENDING_REVIEW },
      include: { price: true },
    });

    this.logger.log(`Listing submitted for review: id=${id}, user=${user.id}`);
    return this.toResponseDto(updated);
  }

  /**
   * Publier une annonce (PENDING_REVIEW → ACTIVE).
   * Réservé à : ADMIN uniquement.
   */
  async publish(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.checkListingAccess(id, user);
    this.validateTransition(listing.status, ListingStatus.ACTIVE, user);

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.ACTIVE,
        publishedAt: new Date(),
      },
      include: { price: true },
    });

    this.logger.log(`Listing published: id=${id}, admin=${user.id}`);
    return this.toResponseDto(updated);
  }

  /**
   * Dépublier temporairement une annonce (ACTIVE → PAUSED).
   * Accessible à : OWNER, AGENT, AGENCY_ADMIN, ADMIN.
   */
  async pause(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.checkListingAccess(id, user);
    this.validateTransition(listing.status, ListingStatus.PAUSED, user);

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.PAUSED },
      include: { price: true },
    });

    this.logger.log(`Listing paused: id=${id}, user=${user.id}`);
    return this.toResponseDto(updated);
  }

  /**
   * Republier une annonce (PAUSED → ACTIVE).
   * Accessible à : OWNER, AGENT, AGENCY_ADMIN, ADMIN.
   */
  async resume(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.checkListingAccess(id, user);
    this.validateTransition(listing.status, ListingStatus.ACTIVE, user);

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.ACTIVE },
      include: { price: true },
    });

    this.logger.log(`Listing resumed: id=${id}, user=${user.id}`);
    return this.toResponseDto(updated);
  }

  /**
   * Rejeter une annonce (PENDING_REVIEW → CANCELLED).
   * Réservé à : ADMIN uniquement.
   */
  async reject(
    user: AuthenticatedUser,
    id: string,
    reason?: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.checkListingAccess(id, user);
    this.validateTransition(listing.status, ListingStatus.CANCELLED, user);

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.CANCELLED,
        // Le motif du rejet peut être loggué ou notifié via un service de notifications ultérieur
      },
      include: { price: true },
    });

    this.logger.log(
      `Listing rejected: id=${id}, admin=${user.id}, reason="${reason ?? 'N/A'}"`,
    );
    return this.toResponseDto(updated);
  }

  /**
   * Marquer une annonce comme complétée (ACTIVE → COMPLETED).
   * Réservé à : ADMIN (la finalisation métier passe par Sale/Rental modules).
   */
  async complete(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.checkListingAccess(id, user);
    this.validateTransition(listing.status, ListingStatus.COMPLETED, user);

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.COMPLETED },
      include: { price: true },
    });

    this.logger.log(`Listing completed: id=${id}, admin=${user.id}`);
    return this.toResponseDto(updated);
  }

  /**
   * Archiver / supprimer une annonce (soft-delete + statut CANCELLED).
   * Accessible à : OWNER, AGENT, AGENCY_ADMIN, ADMIN.
   */
  async archive(
    user: AuthenticatedUser,
    id: string,
  ): Promise<{ message: string }> {
    await this.checkListingAccess(id, user);

    await this.prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.CANCELLED,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Listing archived: id=${id}, user=${user.id}`);
    return { message: 'Annonce archivée avec succès.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Mapping modèle → DTO
  // ─────────────────────────────────────────────────────────────────────────────

  private toResponseDto(listing: any): ListingResponseDto {
    return {
      id: listing.id,
      propertyId: listing.propertyId,
      transactionType: listing.transactionType,
      status: listing.status,
      visibility: listing.visibility,
      title: listing.title ?? undefined,
      description: listing.description ?? undefined,
      slug: listing.slug ?? undefined,
      viewsCount: listing.viewsCount,
      isFeatured: listing.isFeatured,
      publishedAt: listing.publishedAt ?? undefined,
      expiresAt: listing.expiresAt ?? undefined,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      price: listing.price
        ? {
            price: listing.price.price,
            pricePerSqm: listing.price.pricePerSqm ?? undefined,
            currency: listing.price.currency,
            isNegotiable: listing.price.isNegotiable,
            deposit: listing.price.deposit ?? undefined,
            agencyFees: listing.price.agencyFees ?? undefined,
            charges: listing.price.charges ?? undefined,
            chargesIncluded: listing.price.chargesIncluded,
            notaryFees: listing.price.notaryFees ?? undefined,
            taxeFonciere: listing.price.taxeFonciere ?? undefined,
          }
        : undefined,
    };
  }
}
