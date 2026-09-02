import { Injectable, Logger } from '@nestjs/common';
import { ListingStatus, MediaType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { haversineDistance } from '../locations/locations.service';
import type { SearchListingsDto } from './dto/search-listings.dto';
import type {
  ListingSearchResponseDto,
  ListingSearchResultDto,
} from './dto/listing-search-response.dto';

/**
 * Formatte un prix en devise lisible.
 * Ex: 1850 EUR → "1 850 €"
 */
function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * ListingSearchService — Moteur de recherche avancé des annonces immobilières.
 *
 * Architecture de la recherche multi-critères :
 *  1. Filtres SQL (Prisma) : Tous les filtres qui peuvent être poussés en base
 *     (transactionType, type de bien, ville, prix, surface, équipements, statut…)
 *  2. Filtrage géospatial post-query (Haversine) : Appliqué en mémoire sur les
 *     candidats retenus par le pré-filtre bounding box SQL lorsque lat/lng/radiusKm
 *     sont fournis. Garantit une précision géodésique exacte.
 *  3. Tri multi-critères : par prix, date de publication, surface, ou pertinence
 *     (annonces premium remontées en tête + date décroissante).
 *  4. Réponse optimisée frontend : Chaque résultat inclut la photo principale,
 *     la localisation formatée, les données essentielles du bien et le prix formaté
 *     — une seule requête GET pour tout afficher.
 */
@Injectable()
export class ListingSearchService {
  private readonly logger = new Logger(ListingSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(dto: SearchListingsDto): Promise<ListingSearchResponseDto> {
    const {
      page = 1,
      limit = 20,
      transactionType,
      propertyType,
      city,
      neighborhood,
      commune,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      minBedrooms,
      minRooms,
      minBathrooms,
      hasParking,
      hasPool,
      hasGarden,
      isFurnished,
      hasElevator,
      hasGarage,
      hasBalcony,
      lat,
      lng,
      radiusKm = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      q,
    } = dto;

    const skip = (page - 1) * limit;

    // ── 1. Construction du filtre SQL ──────────────────────────────────────────

    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.ACTIVE,
      deletedAt: null,
    };

    if (transactionType) {
      where.transactionType = transactionType;
    }

    // Filtre texte libre sur titre et description
    if (q?.trim()) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        {
          property: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // ── Filtres prix ─────────────────────────────────────────────────────────
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        price: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      };
    }

    // ── Filtres sur le bien physique (Property) ───────────────────────────────
    const propertyWhere: Prisma.PropertyWhereInput = {
      deletedAt: null,
    };

    // Type de bien (slug ou nom)
    if (propertyType) {
      propertyWhere.type = {
        OR: [
          { slug: { contains: propertyType, mode: 'insensitive' } },
          { name: { contains: propertyType, mode: 'insensitive' } },
        ],
      };
    }

    // Surface
    if (minArea !== undefined || maxArea !== undefined) {
      propertyWhere.area = {
        ...(minArea !== undefined ? { gte: minArea } : {}),
        ...(maxArea !== undefined ? { lte: maxArea } : {}),
      };
    }

    // Pièces / chambres / salles de bain
    if (minBedrooms !== undefined)
      propertyWhere.bedrooms = { gte: minBedrooms };
    if (minRooms !== undefined) propertyWhere.rooms = { gte: minRooms };
    if (minBathrooms !== undefined)
      propertyWhere.bathrooms = { gte: minBathrooms };

    // Équipements booléens
    if (hasParking === true) propertyWhere.parkingSpaces = { gt: 0 };
    if (hasPool === true) propertyWhere.hasPool = true;
    if (hasGarden === true) propertyWhere.hasGarden = true;
    if (isFurnished === true) propertyWhere.isFurnished = true;
    if (hasElevator === true) propertyWhere.hasElevator = true;
    if (hasGarage === true) propertyWhere.hasGarage = true;
    if (hasBalcony === true) propertyWhere.hasBalcony = true;

    // ── Filtres localisation ─────────────────────────────────────────────────
    const locationWhere: Prisma.LocationWhereInput = {};

    if (city) locationWhere.city = { contains: city, mode: 'insensitive' };
    if (neighborhood)
      locationWhere.neighborhood = {
        contains: neighborhood,
        mode: 'insensitive',
      };

    // commune → alias de city ou neighborhood
    if (commune) {
      locationWhere.OR = [
        { city: { contains: commune, mode: 'insensitive' } },
        { neighborhood: { contains: commune, mode: 'insensitive' } },
      ];
    }

    // Pré-filtrage géospatial par bounding box SQL si rayon GPS fourni
    if (lat !== undefined && lng !== undefined) {
      const EARTH_RADIUS_KM = 6371;
      const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
      const lngDelta =
        (radiusKm / (EARTH_RADIUS_KM * Math.cos((lat * Math.PI) / 180))) *
        (180 / Math.PI);

      locationWhere.latitude = { gte: lat - latDelta, lte: lat + latDelta };
      locationWhere.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };
    }

    if (Object.keys(locationWhere).length > 0) {
      propertyWhere.location = locationWhere;
    }

    if (Object.keys(propertyWhere).length > 0) {
      where.property = propertyWhere;
    }

    // ── 2. Tri ────────────────────────────────────────────────────────────────

    let orderBy: Prisma.ListingOrderByWithRelationInput[];

    switch (sortBy) {
      case 'price':
        orderBy = [{ isFeatured: 'desc' }, { price: { price: sortOrder } }];
        break;
      case 'area':
        orderBy = [{ isFeatured: 'desc' }, { property: { area: sortOrder } }];
        break;
      case 'relevance':
        // Pertinence : annonces premium > annonces récentes > vues
        orderBy = [
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
          { viewsCount: 'desc' },
        ];
        break;
      case 'date':
      default:
        orderBy = [{ isFeatured: 'desc' }, { publishedAt: sortOrder }];
    }

    // ── 3. Requête Prisma — une seule requête avec toutes les inclusions ───────
    //    Inclut : property.type, property.location, property.media (filtrée sur
    //    isPrimary=true), listing.price.
    //    Pas de N+1 : tout est chargé en une seule passe.

    // Pour le rayon GPS : on sur-échantillonne et on filtrera en mémoire
    // On ne sur-échantillonne que si la recherche par rayon est active
    const needsRadiusFilter = lat !== undefined && lng !== undefined;
    const fetchLimit = needsRadiusFilter ? Math.min(limit * 10, 500) : limit;
    const fetchSkip = needsRadiusFilter ? 0 : skip;

    const [rawListings, dbTotal] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: fetchSkip,
        take: fetchLimit,
        orderBy,
        include: {
          price: true,
          property: {
            include: {
              type: { select: { name: true, slug: true } },
              location: true,
              media: {
                where: { isPrimary: true, type: MediaType.IMAGE },
                take: 1,
                select: { url: true, title: true },
              },
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    // ── 4. Filtrage géospatial précis (Haversine) en mémoire ─────────────────

    let listings = rawListings;
    let total = dbTotal;

    if (needsRadiusFilter) {
      const withDistance = rawListings
        .map((listing) => {
          const location = listing.property?.location;
          if (!location?.latitude || !location?.longitude) {
            return null;
          }
          const distanceKm = haversineDistance(
            lat,
            lng,
            location.latitude,
            location.longitude,
          );
          return distanceKm <= radiusKm ? { listing, distanceKm } : null;
        })
        .filter(Boolean) as {
        listing: (typeof rawListings)[0];
        distanceKm: number;
      }[];

      total = withDistance.length;

      // Appliquer la pagination manuellement après filtrage
      const paginated = withDistance.slice(skip, skip + limit);
      listings = paginated.map(({ listing }) => listing);

      // Injecter la distance dans les résultats
      return {
        items: paginated.map(({ listing, distanceKm }) =>
          this.toSearchResult(listing, distanceKm),
        ),
        meta: this.buildMeta(total, page, limit, dto),
      };
    }

    return {
      items: listings.map((l) => this.toSearchResult(l)),
      meta: this.buildMeta(total, page, limit, dto),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Mapping listing brut → DTO de réponse optimisé frontend
  // ─────────────────────────────────────────────────────────────────────────────

  private toSearchResult(
    listing: any,
    distanceKm?: number,
  ): ListingSearchResultDto {
    const property = listing.property;
    const location = property?.location;
    const primaryPhoto = property?.media?.[0];
    const price = listing.price;
    const type = property?.type;

    const description = listing.description ?? property?.description ?? '';
    const descriptionExcerpt = description
      ? description.slice(0, 200) + (description.length > 200 ? '…' : '')
      : undefined;

    // Adresse formatée pour l'affichage UI
    const formatted = [
      location?.neighborhood,
      location?.city,
      location?.zipCode,
    ]
      .filter(Boolean)
      .join(', ');

    const priceAmount = price?.price ?? 0;
    const currency = price?.currency ?? 'EUR';
    const suffix = listing.transactionType === 'RENT' ? '/mois' : '';
    const priceFormatted = `${formatPrice(priceAmount, currency)}${suffix}`;
    const pricePerSqmFormatted = price?.pricePerSqm
      ? `${formatPrice(price.pricePerSqm, currency)}/m²`
      : undefined;

    return {
      id: listing.id,
      transactionType: listing.transactionType,
      status: listing.status,
      title: listing.title ?? property?.title,
      slug: listing.slug ?? undefined,
      descriptionExcerpt,
      isFeatured: listing.isFeatured,
      viewsCount: listing.viewsCount,
      publishedAt: listing.publishedAt ?? undefined,
      expiresAt: listing.expiresAt ?? undefined,
      createdAt: listing.createdAt,
      ...(distanceKm !== undefined
        ? { distanceKm: Math.round(distanceKm * 100) / 100 }
        : {}),

      price: {
        price: priceAmount,
        currency,
        formatted: priceFormatted,
        pricePerSqm: price?.pricePerSqm ?? undefined,
        pricePerSqmFormatted,
        isNegotiable: price?.isNegotiable ?? false,
        charges: price?.charges ?? undefined,
        deposit: price?.deposit ?? undefined,
        agencyFees: price?.agencyFees ?? undefined,
      },

      property: {
        id: property?.id,
        title: property?.title,
        typeSlug: type?.slug ?? undefined,
        typeName: type?.name ?? undefined,
        area: property?.area,
        landArea: property?.landArea ?? undefined,
        rooms: property?.rooms ?? undefined,
        bedrooms: property?.bedrooms ?? undefined,
        bathrooms: property?.bathrooms ?? undefined,
        parkingSpaces: property?.parkingSpaces ?? undefined,
        isFurnished: property?.isFurnished,
        hasPool: property?.hasPool,
        hasGarden: property?.hasGarden,
        hasElevator: property?.hasElevator,
        hasGarage: property?.hasGarage,
        hasBalcony: property?.hasBalcony,
        energyRating: property?.energyRating ?? undefined,
        ghgRating: property?.ghgRating ?? undefined,
      },

      location: {
        city: location?.city ?? '',
        neighborhood: location?.neighborhood ?? undefined,
        state: location?.state ?? undefined,
        zipCode: location?.zipCode ?? '',
        country: location?.country ?? 'France',
        latitude: location?.latitude ?? undefined,
        longitude: location?.longitude ?? undefined,
        formatted: formatted || undefined,
      },

      primaryPhoto: primaryPhoto
        ? { url: primaryPhoto.url, title: primaryPhoto.title ?? undefined }
        : undefined,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Construction des métadonnées de pagination
  // ─────────────────────────────────────────────────────────────────────────────

  private buildMeta(
    total: number,
    page: number,
    limit: number,
    dto: SearchListingsDto,
  ) {
    const totalPages = Math.ceil(total / limit);

    // Filtres actifs pour l'affichage UI (clés avec une valeur définie)
    const appliedFilters = Object.fromEntries(
      Object.entries(dto).filter(
        ([key, val]) =>
          !['page', 'limit', 'sortBy', 'sortOrder'].includes(key) &&
          val !== undefined,
      ),
    );

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      appliedFilters:
        Object.keys(appliedFilters).length > 0 ? appliedFilters : undefined,
    };
  }
}
