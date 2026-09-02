import { haversineDistance, LocationsService } from './locations.service';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

describe('haversineDistance', () => {
  it('should return ~0 for identical points', () => {
    const dist = haversineDistance(48.8566, 2.3522, 48.8566, 2.3522);
    expect(dist).toBeCloseTo(0, 5);
  });

  it('should compute ~1.11 km between two points ~0.01° lat apart', () => {
    const dist = haversineDistance(48.8566, 2.3522, 48.8666, 2.3522);
    expect(dist).toBeCloseTo(1.11, 1);
  });

  it('should compute distance between Paris and Lyon (~392 km)', () => {
    // Paris: 48.8566, 2.3522 — Lyon: 45.7640, 4.8357
    const dist = haversineDistance(48.8566, 2.3522, 45.764, 4.8357);
    expect(dist).toBeGreaterThan(380);
    expect(dist).toBeLessThan(410);
  });
});

describe('LocationsService', () => {
  let service: LocationsService;

  const mockLocations = [
    {
      id: 'loc-1',
      address: '10 Rue des Abbesses',
      complement: null,
      city: 'Paris',
      state: 'Île-de-France',
      zipCode: '75018',
      country: 'France',
      latitude: 48.8867,
      longitude: 2.3431,
      neighborhood: 'Montmartre',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'loc-2',
      address: '5 Rue du Paradis',
      complement: null,
      city: 'Lyon',
      state: 'Auvergne-Rhône-Alpes',
      zipCode: '69001',
      country: 'France',
      latitude: 45.764,
      longitude: 4.8357,
      neighborhood: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const prismaMock = {
    location: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  describe('search', () => {
    it('should return paginated locations matching city query', async () => {
      prismaMock.location.findMany.mockResolvedValue([mockLocations[0]]);
      prismaMock.location.count.mockResolvedValue(1);

      const result = await service.search({
        city: 'Paris',
        page: 1,
        limit: 10,
      } as any);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].city).toBe('Paris');
      expect(result.meta.total).toBe(1);
    });

    it('should return all locations when no filter is provided', async () => {
      prismaMock.location.findMany.mockResolvedValue(mockLocations);
      prismaMock.location.count.mockResolvedValue(2);

      const result = await service.search({ page: 1, limit: 10 } as any);

      expect(result.items).toHaveLength(2);
    });
  });

  describe('searchByRadius', () => {
    it('should return nearby locations within radius and include distance', async () => {
      // Only loc-1 (Montmartre, Paris) within 5 km of 48.880, 2.340
      prismaMock.location.findMany.mockResolvedValue([mockLocations[0]]);

      const result = await service.searchByRadius({
        lat: 48.88,
        lng: 2.34,
        radiusKm: 5,
      });

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].distanceKm).toBeDefined();
      expect(result[0].distanceKm!).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no location is within radius', async () => {
      prismaMock.location.findMany.mockResolvedValue([]);

      const result = await service.searchByRadius({
        lat: 43.2965,
        lng: 5.3698,
        radiusKm: 1,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('searchByBoundingBox', () => {
    it('should return locations within bounding box coordinates', async () => {
      prismaMock.location.findMany.mockResolvedValue([mockLocations[0]]);

      const result = await service.searchByBoundingBox({
        minLat: 48.815,
        maxLat: 48.902,
        minLng: 2.224,
        maxLng: 2.469,
      });

      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Paris');
    });
  });

  describe('getGeoJson', () => {
    it('should return GeoJSON FeatureCollection with correct structure', async () => {
      prismaMock.location.findMany.mockResolvedValue([mockLocations[0]]);

      const result = await service.getGeoJson();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
      expect(result.features[0].type).toBe('Feature');
      expect(result.features[0].geometry.type).toBe('Point');
      expect(result.features[0].geometry.coordinates).toHaveLength(2);
      expect(result.features[0].geometry.coordinates[0]).toBe(
        mockLocations[0].longitude,
      );
      expect(result.features[0].geometry.coordinates[1]).toBe(
        mockLocations[0].latitude,
      );
    });

    it('should exclude locations without GPS coordinates', async () => {
      prismaMock.location.findMany.mockResolvedValue([
        { ...mockLocations[1], latitude: null, longitude: null },
      ]);

      const result = await service.getGeoJson();

      expect(result.features).toHaveLength(0);
    });
  });

  describe('getSuggestions', () => {
    it('should return formatted label suggestions', async () => {
      prismaMock.location.findMany.mockResolvedValue([
        {
          id: 'loc-1',
          city: 'Paris',
          neighborhood: 'Montmartre',
          zipCode: '75018',
          state: 'Île-de-France',
          latitude: 48.8867,
          longitude: 2.3431,
        },
      ]);

      const result = await service.getSuggestions('Mont');

      expect(result).toHaveLength(1);
      expect(result[0].label).toContain('Montmartre');
      expect(result[0].label).toContain('Paris');
    });

    it('should return empty array for short query', async () => {
      const result = await service.getSuggestions('P');
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return location by id', async () => {
      prismaMock.location.findUnique.mockResolvedValue(mockLocations[0]);

      const result = await service.findOne('loc-1');

      expect(result.id).toBe('loc-1');
      expect(result.city).toBe('Paris');
    });

    it('should throw NotFoundException if location does not exist', async () => {
      prismaMock.location.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
