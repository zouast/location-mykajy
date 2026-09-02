import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { SavedSearchResponseDto } from './dto/saved-search-response.dto';
import { ListingStatus, Prisma } from '@prisma/client';
import { ListingSearchResultDto } from '../listings/dto/listing-search-response.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une nouvelle recherche sauvegardée
   */
  async create(userId: string, dto: CreateSavedSearchDto): Promise<SavedSearchResponseDto> {
    const saved = await this.prisma.savedSearch.create({
      data: {
        userId,
        name: dto.name,
        transactionType: dto.transactionType,
        city: dto.city,
        minPrice: dto.minPrice,
        maxPrice: dto.maxPrice,
        minArea: dto.minArea,
        maxArea: dto.maxArea,
        minRooms: dto.minRooms,
        propertyTypeId: dto.propertyTypeId,
        isActive: dto.isActive ?? true,
      },
    });

    return saved;
  }

  /**
   * Lister toutes les recherches sauvegardées de l'utilisateur
   */
  async findAll(userId: string): Promise<SavedSearchResponseDto[]> {
    const list = await this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Pour chaque recherche, compter le nombre d'annonces actives correspondantes
    const results = await Promise.all(
      list.map(async (search) => {
        const whereClause = this.buildWhereClause(search);
        const count = await this.prisma.listing.count({ where: whereClause });
        return {
          ...search,
          matchedCount: count,
        };
      }),
    );

    return results;
  }

  /**
   * Récupérer une recherche sauvegardée par ID
   */
  async findOne(userId: string, id: string): Promise<SavedSearchResponseDto> {
    const search = await this.prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!search) {
      throw new NotFoundException(`Recherche sauvegardée avec l'ID ${id} non trouvée`);
    }

    if (search.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à cette recherche");
    }

    const whereClause = this.buildWhereClause(search);
    const count = await this.prisma.listing.count({ where: whereClause });

    return {
      ...search,
      matchedCount: count,
    };
  }

  /**
   * Mettre à jour une recherche sauvegardée
   */
  async update(
    userId: string,
    id: string,
    dto: UpdateSavedSearchDto,
  ): Promise<SavedSearchResponseDto> {
    await this.findOne(userId, id); // Vérifie l'existence et l'autorisation

    const updated = await this.prisma.savedSearch.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.transactionType !== undefined && { transactionType: dto.transactionType }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.minPrice !== undefined && { minPrice: dto.minPrice }),
        ...(dto.maxPrice !== undefined && { maxPrice: dto.maxPrice }),
        ...(dto.minArea !== undefined && { minArea: dto.minArea }),
        ...(dto.maxArea !== undefined && { maxArea: dto.maxArea }),
        ...(dto.minRooms !== undefined && { minRooms: dto.minRooms }),
        ...(dto.propertyTypeId !== undefined && { propertyTypeId: dto.propertyTypeId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return updated;
  }

  /**
   * Supprimer une recherche sauvegardée
   */
  async remove(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(userId, id); // Vérifie existence & droits

    await this.prisma.savedSearch.delete({
      where: { id },
    });

    return { success: true, message: 'Recherche sauvegardée supprimée avec succès.' };
  }

  /**
   * Exécuter la recherche sauvegardée et retourner les annonces correspondantes
   */
  async findMatches(
    userId: string,
    id: string,
    page = 1,
    limit = 12,
  ): Promise<{ items: ListingSearchResultDto[]; total: number; page: number; totalPages: number }> {
    const search = await this.findOne(userId, id);
    const whereClause = this.buildWhereClause(search);
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          price: true,
          property: {
            include: {
              type: true,
              location: true,
              media: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.listing.count({ where: whereClause }),
    ]);

    const items: ListingSearchResultDto[] = listings.map((l) => {
      const prop = l.property;
      const primaryPhoto = prop.media[0]
        ? { url: prop.media[0].url, title: prop.media[0].title || undefined }
        : undefined;

      const priceVal = l.price?.price ?? 0;
      const curr = l.price?.currency ?? 'EUR';
      const formattedPrice =
        l.transactionType === 'RENT'
          ? `${priceVal.toLocaleString('fr-FR')} €/mois`
          : `${priceVal.toLocaleString('fr-FR')} €`;

      return {
        id: l.id,
        transactionType: l.transactionType,
        status: l.status,
        title: l.title || prop.title,
        slug: l.slug || undefined,
        descriptionExcerpt: l.description ? l.description.substring(0, 160) + '...' : undefined,
        isFeatured: l.isFeatured,
        viewsCount: l.viewsCount,
        publishedAt: l.publishedAt || undefined,
        expiresAt: l.expiresAt || undefined,
        createdAt: l.createdAt,
        price: {
          price: priceVal,
          currency: curr,
          formatted: formattedPrice,
          pricePerSqm: l.price?.pricePerSqm || undefined,
          isNegotiable: l.price?.isNegotiable ?? false,
          charges: l.price?.charges || undefined,
          deposit: l.price?.deposit || undefined,
          agencyFees: l.price?.agencyFees || undefined,
        },
        property: {
          id: prop.id,
          title: prop.title,
          typeSlug: prop.type?.slug,
          typeName: prop.type?.name,
          area: prop.area,
          landArea: prop.landArea || undefined,
          rooms: prop.rooms || undefined,
          bedrooms: prop.bedrooms || undefined,
          bathrooms: prop.bathrooms || undefined,
          parkingSpaces: prop.parkingSpaces || undefined,
          isFurnished: prop.isFurnished,
          hasPool: prop.hasPool,
          hasGarden: prop.hasGarden,
          hasElevator: prop.hasElevator,
          hasGarage: prop.hasGarage,
          hasBalcony: prop.hasBalcony,
          energyRating: prop.energyRating || undefined,
          ghgRating: prop.ghgRating || undefined,
        },
        location: {
          city: prop.location.city,
          neighborhood: prop.location.neighborhood || undefined,
          state: prop.location.state || undefined,
          zipCode: prop.location.zipCode,
          country: prop.location.country,
          latitude: prop.location.latitude || undefined,
          longitude: prop.location.longitude || undefined,
          formatted: [prop.location.neighborhood, prop.location.city, prop.location.zipCode]
            .filter(Boolean)
            .join(', '),
        },
        primaryPhoto,
      };
    });

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Architecture de Notification : Trouver toutes les recherches sauvegardées actives
   * qui correspondent à une annonce donnée (pour déclencher l'envoi d'alertes email/push)
   */
  async findMatchingSearchesForListing(listingId: string): Promise<SavedSearchResponseDto[]> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        price: true,
        property: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      return [];
    }

    const price = listing.price?.price ?? 0;
    const city = listing.property.location.city;
    const area = listing.property.area;
    const rooms = listing.property.rooms;
    const typeId = listing.property.typeId;

    // Chercher les recherches sauvegardées actives correspondantes
    const matchingSearches = await this.prisma.savedSearch.findMany({
      where: {
        isActive: true,
        AND: [
          // TransactionType
          {
            OR: [{ transactionType: null }, { transactionType: listing.transactionType }],
          },
          // Ville
          {
            OR: [{ city: null }, { city: { equals: city, mode: 'insensitive' } }],
          },
          // Min / Max Price
          {
            OR: [{ minPrice: null }, { minPrice: { lte: price } }],
          },
          {
            OR: [{ maxPrice: null }, { maxPrice: { gte: price } }],
          },
          // Min / Max Area
          {
            OR: [{ minArea: null }, { minArea: { lte: area } }],
          },
          {
            OR: [{ maxArea: null }, { maxArea: { gte: area } }],
          },
          // Rooms
          {
            OR: [{ minRooms: null }, { minRooms: { lte: rooms ?? 0 } }],
          },
          // Type
          {
            OR: [{ propertyTypeId: null }, { propertyTypeId: typeId }],
          },
        ],
      },
    });

    return matchingSearches;
  }

  /**
   * Helper pour construire la clause Where Prisma
   */
  private buildWhereClause(search: {
    transactionType?: string | null;
    city?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    minArea?: number | null;
    maxArea?: number | null;
    minRooms?: number | null;
    propertyTypeId?: string | null;
  }): Prisma.ListingWhereInput {
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.ACTIVE,
    };

    if (search.transactionType) {
      where.transactionType = search.transactionType as Prisma.EnumTransactionTypeFilter;
    }

    if (search.minPrice !== null && search.minPrice !== undefined) {
      where.price = { ...where.price, price: { gte: search.minPrice } };
    }

    if (search.maxPrice !== null && search.maxPrice !== undefined) {
      where.price = { ...where.price, price: { ...(where.price?.price as object), lte: search.maxPrice } };
    }

    if (search.city || search.minArea || search.maxArea || search.minRooms || search.propertyTypeId) {
      where.property = {};

      if (search.city) {
        where.property.location = {
          city: { equals: search.city, mode: 'insensitive' },
        };
      }

      if (search.minArea !== null && search.minArea !== undefined) {
        where.property.area = { gte: search.minArea };
      }

      if (search.maxArea !== null && search.maxArea !== undefined) {
        where.property.area = { ...(where.property.area as object), lte: search.maxArea };
      }

      if (search.minRooms !== null && search.minRooms !== undefined) {
        where.property.rooms = { gte: search.minRooms };
      }

      if (search.propertyTypeId) {
        where.property.typeId = search.propertyTypeId;
      }
    }

    return where;
  }
}
