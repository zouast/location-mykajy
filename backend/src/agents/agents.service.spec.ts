import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { PrismaService } from '../database/prisma.service';

describe('AgentsService', () => {
  let service: AgentsService;

  const mockAgent = {
    id: 'agent-uuid-1',
    userId: 'user-uuid-1',
    agencyId: 'agency-uuid-1',
    title: 'Conseiller Luxe',
    licenseNumber: 'CPI75012020000000002',
    biography: 'Expert immobilier',
    specialties: ['Luxe', 'Investissement'],
    yearsExperience: 8,
    isAvailable: true,
    rating: 4.8,
    reviewCount: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-uuid-1',
      email: 'agent@immoprestige.com',
      firstName: 'Lucas',
      lastName: 'Bernard',
    },
    agency: {
      id: 'agency-uuid-1',
      name: 'Immo Prestige Paris',
      address: '12 Avenue Montaigne',
      city: 'Paris',
      phone: '+33140000000',
      email: 'contact@immoprestige.com',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  };

  const prismaMock = {
    agent: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    property: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    listing: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
  });

  describe('getMyProfile', () => {
    it('should return agent profile with safe user', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.getMyProfile('user-uuid-1');

      expect(result.id).toBe('agent-uuid-1');
      expect(result.title).toBe('Conseiller Luxe');
      expect(result.user.email).toBe('agent@immoprestige.com');
    });

    it('should throw ForbiddenException if user has no agent profile', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile('user-client-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateMyProfile', () => {
    it('should update agent profile information', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(mockAgent);
      prismaMock.agent.update.mockResolvedValue({
        ...mockAgent,
        title: 'Directeur Commercial',
        isAvailable: false,
      });

      const result = await service.updateMyProfile('user-uuid-1', {
        title: 'Directeur Commercial',
        isAvailable: false,
      });

      expect(result.title).toBe('Directeur Commercial');
      expect(result.isAvailable).toBe(false);
    });
  });

  describe('getMyAgency', () => {
    it('should return associated agency', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.getMyAgency('user-uuid-1');

      expect(result.name).toBe('Immo Prestige Paris');
    });
  });

  describe('getMyProperties', () => {
    it('should return paginated agent properties', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(mockAgent);
      prismaMock.property.findMany.mockResolvedValue([
        { id: 'prop-1', title: 'Appartement Haussmannien', area: 120 },
      ]);
      prismaMock.property.count.mockResolvedValue(1);

      const result = await service.getMyProperties('user-uuid-1', {
        page: 1,
        limit: 10,
      } as any);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getMyListings', () => {
    it('should return paginated agent listings', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(mockAgent);
      prismaMock.listing.findMany.mockResolvedValue([
        {
          id: 'listing-1',
          propertyId: 'prop-1',
          transactionType: 'SALE',
          status: 'ACTIVE',
          title: 'Bel appartement',
          price: { price: 950000 },
          viewsCount: 45,
          contactCount: 3,
          createdAt: new Date(),
        },
      ]);
      prismaMock.listing.count.mockResolvedValue(1);

      const result = await service.getMyListings('user-uuid-1', {
        page: 1,
        limit: 10,
      } as any);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].price).toBe(950000);
      expect(result.meta.total).toBe(1);
    });
  });
});
