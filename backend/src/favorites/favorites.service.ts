import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FavoriteResponseDto } from './dto/favorite-response.dto';
import { ListingSearchResultDto } from '../listings/dto/listing-search-response.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ajouter une annonce aux favoris
   */
  async addFavorite(userId: string, listingId: string): Promise<FavoriteResponseDto> {
    // Vérifier que l'annonce existe
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException(`L'annonce avec l'ID ${listingId} n'existe pas`);
    }

    // Vérifier si le favori existe déjà
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        listingId,
      },
    });

    return favorite;
  }

  /**
   * Retirer une annonce des favoris
   */
  async removeFavorite(userId: string, listingId: string): Promise<{ success: boolean; message: string }> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException("Cette annonce ne figure pas dans vos favoris");
    }

    await this.prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return { success: true, message: 'Annonce retirée de vos favoris avec succès.' };
  }

  /**
   * Récupérer les favoris d'un utilisateur avec toutes les données de l'annonce
   */
  async getUserFavorites(
    userId: string,
    page = 1,
    limit = 12,
  ): Promise<{ items: FavoriteResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
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
          },
        },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    const items: FavoriteResponseDto[] = favorites.map((fav) => {
      const l = fav.listing;
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

      const formattedPriceSqm =
        l.price?.pricePerSqm !== undefined && l.price?.pricePerSqm !== null
          ? `${l.price.pricePerSqm.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/m²`
          : undefined;

      const listingDto: ListingSearchResultDto = {
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
          pricePerSqmFormatted: formattedPriceSqm,
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

      return {
        id: fav.id,
        listingId: fav.listingId,
        createdAt: fav.createdAt,
        listing: listingDto,
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
   * Récupérer tous les IDs des annonces favorites pour un badge rapide en UI
   */
  async getUserFavoriteListingIds(userId: string): Promise<string[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { listingId: true },
    });
    return favorites.map((f) => f.listingId);
  }

  /**
   * Vérifier si une annonce est en favori
   */
  async isFavorite(userId: string, listingId: string): Promise<boolean> {
    const fav = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });
    return !!fav;
  }
}
