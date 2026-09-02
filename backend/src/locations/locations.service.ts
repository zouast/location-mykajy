import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { LocationSearchDto } from './dto/location-search.dto';
import type { RadiusSearchDto } from './dto/radius-search.dto';
import type { BoundingBoxSearchDto } from './dto/bounding-box-search.dto';
import type {
  LocationResponseDto,
  LocationWithDistanceDto,
  LocationSuggestionDto,
} from './dto/location-response.dto';
import type {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoJsonPointProperties,
} from './interfaces/geojson.interface';

/**
 * Rayon moyen de la Terre en kilomètres — utilisé dans la formule de Haversine.
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Calcule la distance géodésique (formule de Haversine) entre deux points GPS.
 * @param lat1 Latitude du premier point (degrés décimaux)
 * @param lng1 Longitude du premier point (degrés décimaux)
 * @param lat2 Latitude du second point (degrés décimaux)
 * @param lng2 Longitude du second point (degrés décimaux)
 * @returns Distance en kilomètres
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * LocationsService — Moteur de recherche géographique multi-stratégies.
 *
 * Stratégies implémentées :
 *  1. Recherche textuelle hiérarchique (pays > région > ville > quartier > adresse > code postal).
 *  2. Recherche par rayon GPS (formule de Haversine).
 *  3. Recherche par boîte englobante / viewport (Bounding Box) pour les cartes interactives.
 *  4. Génération de flux GeoJSON RFC 7946 (Leaflet / OpenStreetMap / Mapbox / Google Maps ready).
 *  5. Autocomplétion et suggestions pour les barres de recherche frontend.
 *
 * Architecture cartographique :
 *  Ce service ne dépend d'aucun fournisseur cartographique tiers. Les interfaces GeoJSON
 *  sont conformes au standard RFC 7946 et peuvent être consommées nativement par
 *  OpenStreetMap, Leaflet, Mapbox GL JS, Google Maps, ou tout autre moteur cartographique.
 */
@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Recherche Textuelle / Administrative
  // ─────────────────────────────────────────────────────────────────────────────

  async search(dto: LocationSearchDto): Promise<{
    items: LocationResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 20,
      query,
      country,
      state,
      city,
      commune,
      neighborhood,
      zipCode,
    } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.LocationWhereInput = {};

    if (query) {
      where.OR = [
        { city: { contains: query, mode: 'insensitive' } },
        { neighborhood: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { zipCode: { contains: query, mode: 'insensitive' } },
        { state: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (neighborhood)
      where.neighborhood = { contains: neighborhood, mode: 'insensitive' };
    if (zipCode) where.zipCode = { contains: zipCode, mode: 'insensitive' };

    // commune est géré comme un alias de city/neighborhood dans le schéma actuel
    if (commune) {
      where.OR = [
        ...(Array.isArray(where.OR) ? where.OR : []),
        { city: { contains: commune, mode: 'insensitive' } },
        { neighborhood: { contains: commune, mode: 'insensitive' } },
      ];
    }

    const [locations, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        skip,
        take: limit,
        orderBy: { city: 'asc' },
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      items: locations.map(this.toResponseDto),
      meta: { total, page, limit },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Recherche par Rayon GPS (Haversine)
  // ─────────────────────────────────────────────────────────────────────────────

  async searchByRadius(
    dto: RadiusSearchDto,
  ): Promise<LocationWithDistanceDto[]> {
    const { lat, lng, radiusKm = 10 } = dto;

    // Pré-filtrage grossier par bounding box pour réduire le nombre de calculs
    const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
    const lngDelta =
      (radiusKm / (EARTH_RADIUS_KM * Math.cos((lat * Math.PI) / 180))) *
      (180 / Math.PI);

    const candidates = await this.prisma.location.findMany({
      where: {
        latitude: { gte: lat - latDelta, lte: lat + latDelta },
        longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
    });

    // Filtrage précis par formule de Haversine + tri par distance croissante
    return candidates
      .map((loc) => {
        const distanceKm =
          loc.latitude !== null && loc.longitude !== null
            ? haversineDistance(lat, lng, loc.latitude, loc.longitude)
            : Infinity;
        return { ...this.toResponseDto(loc), distanceKm };
      })
      .filter((loc) => loc.distanceKm <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Recherche par Boîte Englobante / Viewport (Bounding Box)
  // ─────────────────────────────────────────────────────────────────────────────

  async searchByBoundingBox(
    dto: BoundingBoxSearchDto,
  ): Promise<LocationResponseDto[]> {
    const { minLat, maxLat, minLng, maxLng } = dto;

    const locations = await this.prisma.location.findMany({
      where: {
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
      },
      orderBy: { city: 'asc' },
    });

    return locations.map(this.toResponseDto);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Génération de Flux GeoJSON (RFC 7946)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Retourne une FeatureCollection GeoJSON standard.
   * Compatible nativement avec Leaflet, OpenStreetMap, Mapbox GL JS, Google Maps, QGIS, etc.
   * Aucun couplage avec un fournisseur cartographique particulier.
   */
  async getGeoJson(
    filter?: Partial<BoundingBoxSearchDto>,
  ): Promise<GeoJsonFeatureCollection<GeoJsonPointProperties>> {
    const where: Prisma.LocationWhereInput = {
      latitude: { not: null },
      longitude: { not: null },
    };

    if (filter?.minLat !== undefined)
      where.latitude = { ...(where.latitude as object), gte: filter.minLat };
    if (filter?.maxLat !== undefined)
      where.latitude = { ...(where.latitude as object), lte: filter.maxLat };
    if (filter?.minLng !== undefined)
      where.longitude = { ...(where.longitude as object), gte: filter.minLng };
    if (filter?.maxLng !== undefined)
      where.longitude = { ...(where.longitude as object), lte: filter.maxLng };

    const locations = await this.prisma.location.findMany({
      where,
      include: { property: { select: { id: true, title: true } } },
    });

    const features: GeoJsonFeature<GeoJsonPointProperties>[] = locations
      .filter((loc) => loc.latitude !== null && loc.longitude !== null)
      .map((loc) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [loc.longitude!, loc.latitude!],
        },
        properties: {
          id: loc.id,
          title: (loc as any).property?.title,
          city: loc.city,
          neighborhood: loc.neighborhood ?? undefined,
          zipCode: loc.zipCode,
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Autocomplétion & Suggestions
  // ─────────────────────────────────────────────────────────────────────────────

  async getSuggestions(
    query: string,
    limit = 10,
  ): Promise<LocationSuggestionDto[]> {
    if (!query || query.trim().length < 2) return [];

    const locations = await this.prisma.location.findMany({
      where: {
        OR: [
          { city: { contains: query, mode: 'insensitive' } },
          { neighborhood: { contains: query, mode: 'insensitive' } },
          { zipCode: { startsWith: query } },
          { state: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        city: true,
        neighborhood: true,
        zipCode: true,
        state: true,
        latitude: true,
        longitude: true,
      },
    });

    return locations.map((loc) => ({
      id: loc.id,
      label: [loc.neighborhood, loc.city, loc.zipCode]
        .filter(Boolean)
        .join(', '),
      latitude: loc.latitude ?? undefined,
      longitude: loc.longitude ?? undefined,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Consultation d'une Localisation
  // ─────────────────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<LocationResponseDto> {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Localisation introuvable (id: ${id})`);
    }
    return this.toResponseDto(location);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilitaire — Mapping modèle → DTO de réponse
  // ─────────────────────────────────────────────────────────────────────────────

  private toResponseDto(loc: any): LocationResponseDto {
    return {
      id: loc.id,
      address: loc.address,
      complement: loc.complement ?? undefined,
      city: loc.city,
      state: loc.state ?? undefined,
      zipCode: loc.zipCode,
      country: loc.country,
      latitude: loc.latitude ?? undefined,
      longitude: loc.longitude ?? undefined,
      neighborhood: loc.neighborhood ?? undefined,
    };
  }
}
