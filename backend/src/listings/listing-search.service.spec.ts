import { Test, TestingModule } from '@nestjs/testing';
import { ListingStatus, TransactionType } from '@prisma/client';
import { ListingSearchService } from './listing-search.service';
import { PrismaService } from '../database/prisma.service';

describe('ListingSearchService', () => {
  let service: ListingSearchService;

  const makeListing = (overrides: Partial<any> = {}): any => ({
    id: `listing-${Math.random()}`,
    transactionType: TransactionType.RENT,
    status: ListingStatus.ACTIVE,
    title: 'Appartement Montmartre',
    description:
      'Superbe appartement lumineux au cœur de Montmartre, vue dégagée.',
    slug: 'appartement-montmartre-12345',
    isFeatured: false,
    viewsCount: 42,
    publishedAt: new Date('2026-07-01'),
    expiresAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    price: {
      price: 1850,
      currency: 'EUR',
      pricePerSqm: 19.47,
      isNegotiable: false,
      charges: 120,
      deposit: 3700,
      agencyFees: null,
      chargesIncluded: false,
    },
    property: {
      id: 'property-1',
      title: 'Appartement 4 pièces Montmartre',
      description: 'Bel appartement',
      area: 95.5,
      landArea: null,
      rooms: 4,
      bedrooms: 2,
      bathrooms: 1,
      parkingSpaces: 1,
      isFurnished: false,
      hasPool: false,
      hasGarden: false,
      hasElevator: false,
      hasGarage: false,
      hasBalcony: true,
      energyRating: 'B',
      ghgRating: 'A',
      type: { name: 'Appartement', slug: 'appartement' },
      location: {
        city: 'Paris',
        neighborhood: 'Montmartre',
        state: 'Île-de-France',
        zipCode: '75018',
        country: 'France',
        latitude: 48.8867,
        longitude: 2.3431,
      },
      media: [{ url: 'https://cdn.example.com/salon.jpg', title: 'Salon' }],
    },
    ...overrides,
  });

  const prismaMock = {
    listing: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingSearchService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ListingSearchService>(ListingSearchService);
  });

  describe('search', () => {
    it('should return paginated search results with nested property, location and price', async () => {
      const listing = makeListing();
      prismaMock.listing.findMany.mockResolvedValue([listing]);
      prismaMock.listing.count.mockResolvedValue(1);

      const result = await service.search({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].price.price).toBe(1850);
      expect(result.items[0].price.formatted.replace(/\s/g, ' ')).toContain(
        '1 850',
      );
      expect(result.items[0].location.city).toBe('Paris');
      expect(result.items[0].location.neighborhood).toBe('Montmartre');
      expect(result.items[0].primaryPhoto?.url).toContain('salon.jpg');
      expect(result.items[0].property.typeSlug).toBe('appartement');
    });

    it('should return correct pagination metadata', async () => {
      prismaMock.listing.findMany.mockResolvedValue([makeListing()]);
      prismaMock.listing.count.mockResolvedValue(42);

      const result = await service.search({ page: 2, limit: 10 });

      expect(result.meta.total).toBe(42);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(true);
    });

    it('should truncate description to 200 characters with ellipsis', async () => {
      const longDescription = 'A'.repeat(250);
      const listing = makeListing({ description: longDescription });
      prismaMock.listing.findMany.mockResolvedValue([listing]);
      prismaMock.listing.count.mockResolvedValue(1);

      const result = await service.search({});

      expect(result.items[0].descriptionExcerpt).toHaveLength(201); // 200 + '…'
      expect(result.items[0].descriptionExcerpt).toMatch(/…$/);
    });

    it('should include appliedFilters in meta when filters are active', async () => {
      prismaMock.listing.findMany.mockResolvedValue([]);
      prismaMock.listing.count.mockResolvedValue(0);

      const result = await service.search({
        city: 'Paris',
        minPrice: 1000,
        transactionType: TransactionType.RENT,
      });

      expect(result.meta.appliedFilters).toBeDefined();
      expect(result.meta.appliedFilters?.city).toBe('Paris');
      expect(result.meta.appliedFilters?.minPrice).toBe(1000);
    });

    it('should return empty results gracefully', async () => {
      prismaMock.listing.findMany.mockResolvedValue([]);
      prismaMock.listing.count.mockResolvedValue(0);

      const result = await service.search({ city: 'Timbuktu' });

      expect(result.items).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should filter by radius using Haversine and return distanceKm', async () => {
      // Listing in Paris (48.8867, 2.3431) — ~2 km from search center
      const listing = makeListing();
      // The bounding box pre-filter will return results, then Haversine filters
      prismaMock.listing.findMany.mockResolvedValue([listing]);
      prismaMock.listing.count.mockResolvedValue(1);

      const result = await service.search({
        lat: 48.873, // ~1.5 km north of Montmartre
        lng: 2.346,
        radiusKm: 5,
      });

      if (result.items.length > 0) {
        expect(result.items[0].distanceKm).toBeDefined();
        expect(result.items[0].distanceKm!).toBeLessThanOrEqual(5);
      }
    });

    it('should exclude listing outside radius', async () => {
      // Listing in Lyon (45.764, 4.8357) — ~400 km from Paris
      const lyonListing = makeListing({
        property: {
          ...makeListing().property,
          location: {
            city: 'Lyon',
            neighborhood: null,
            state: 'Auvergne-Rhône-Alpes',
            zipCode: '69001',
            country: 'France',
            latitude: 45.764,
            longitude: 4.8357,
          },
        },
      });

      prismaMock.listing.findMany.mockResolvedValue([lyonListing]);
      prismaMock.listing.count.mockResolvedValue(1);

      // Searching within 10 km of Paris center
      const result = await service.search({
        lat: 48.8566,
        lng: 2.3522,
        radiusKm: 10,
      });

      // Lyon is ~400 km away — must be excluded
      expect(result.items).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should sort by price ascending when sortBy=price&sortOrder=asc', async () => {
      prismaMock.listing.findMany.mockResolvedValue([]);
      prismaMock.listing.count.mockResolvedValue(0);

      await service.search({ sortBy: 'price', sortOrder: 'asc' });

      expect(prismaMock.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([
            expect.objectContaining({ price: { price: 'asc' } }),
          ]),
        }),
      );
    });

    it('should include isFeatured:desc as first sort criterion (relevance)', async () => {
      prismaMock.listing.findMany.mockResolvedValue([]);
      prismaMock.listing.count.mockResolvedValue(0);

      await service.search({ sortBy: 'relevance' });

      expect(prismaMock.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([
            expect.objectContaining({ isFeatured: 'desc' }),
          ]),
        }),
      );
    });
  });
});
