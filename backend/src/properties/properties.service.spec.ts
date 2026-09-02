import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PropertyStatus, Role } from '@prisma/client';
import { PropertiesService } from './properties.service';
import { PrismaService } from '../database/prisma.service';

describe('PropertiesService', () => {
  let service: PropertiesService;

  const mockAdminUser = {
    id: 'admin-uuid-1',
    email: 'admin@example.com',
    role: Role.ADMIN,
  } as any;

  const mockOwnerUser = {
    id: 'owner-user-uuid-1',
    email: 'owner@example.com',
    role: Role.OWNER,
  } as any;

  const mockAgentUser = {
    id: 'agent-user-uuid-1',
    email: 'agent@example.com',
    role: Role.AGENT,
  } as any;

  const mockPropertyType = {
    id: 'type-uuid-1',
    name: 'Appartement',
    slug: 'appartement',
  };

  const mockLocation = {
    id: 'loc-uuid-1',
    address: '15 Boulevard Saint-Germain',
    city: 'Paris',
    zipCode: '75005',
    country: 'France',
  };

  const mockProperty = {
    id: 'prop-uuid-1',
    title: 'Appartement 4 pièces Saint-Germain',
    description: 'Bel appartement',
    status: PropertyStatus.AVAILABLE,
    area: 95.5,
    landArea: 0,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 1,
    yearBuilt: 1910,
    typeId: 'type-uuid-1',
    locationId: 'loc-uuid-1',
    ownerId: 'owner-profile-1',
    agencyId: 'agency-1',
    agentId: 'agent-profile-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    type: mockPropertyType,
    location: mockLocation,
    features: [],
    media: [],
  };

  const prismaMock = {
    propertyType: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    owner: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    agent: {
      findUnique: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    location: {
      create: jest.fn(),
      update: jest.fn(),
    },
    propertyFeature: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  describe('resolvePropertyType', () => {
    it('should return existing property type ID', async () => {
      prismaMock.propertyType.findFirst.mockResolvedValue(mockPropertyType);

      const result = await service.resolvePropertyType('appartement');

      expect(result).toBe('type-uuid-1');
    });

    it('should create property type if not existing', async () => {
      prismaMock.propertyType.findFirst.mockResolvedValue(null);
      prismaMock.propertyType.create.mockResolvedValue({
        id: 'new-type-id',
        name: 'Villa',
        slug: 'villa',
      });

      const result = await service.resolvePropertyType('villa');

      expect(result).toBe('new-type-id');
      expect(prismaMock.propertyType.create).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a property by an OWNER and assign ownerId', async () => {
      prismaMock.propertyType.findFirst.mockResolvedValue(mockPropertyType);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });

      prismaMock.$transaction.mockImplementation(async (cb) => {
        return cb({
          location: { create: jest.fn().mockResolvedValue(mockLocation) },
          property: { create: jest.fn().mockResolvedValue(mockProperty) },
        });
      });

      const result = await service.create(mockOwnerUser, {
        title: 'Appartement 4 pièces Saint-Germain',
        description: 'Bel appartement',
        type: 'appartement',
        area: 95.5,
        location: {
          address: '15 Boulevard Saint-Germain',
          city: 'Paris',
          zipCode: '75005',
        },
      });

      expect(result.id).toBe('prop-uuid-1');
    });
  });

  describe('update', () => {
    it('should allow OWNER to update their own property', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });

      prismaMock.$transaction.mockImplementation(async (cb) => {
        return cb({
          property: {
            update: jest.fn().mockResolvedValue({
              ...mockProperty,
              title: 'Titre Modifié',
            }),
          },
        });
      });

      const result = await service.update(mockOwnerUser, 'prop-uuid-1', {
        title: 'Titre Modifié',
      });

      expect(result.title).toBe('Titre Modifié');
    });

    it('should reject if user does not have permission on the property', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({
        id: 'different-owner-id',
      });

      await expect(
        service.update(mockOwnerUser, 'prop-uuid-1', {
          title: 'Titre Modifié',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return property by ID if AVAILABLE for public', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);

      const result = await service.findOne('prop-uuid-1');

      expect(result.id).toBe('prop-uuid-1');
    });

    it('should throw NotFoundException if property does not exist', async () => {
      prismaMock.property.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated properties with filters', async () => {
      prismaMock.property.findMany.mockResolvedValue([mockProperty]);
      prismaMock.property.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        city: 'Paris',
        minArea: 50,
      } as any);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('should archive and soft-delete property for authorized user', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      prismaMock.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.ARCHIVED,
        deletedAt: new Date(),
      });

      const result = await service.remove(mockOwnerUser, 'prop-uuid-1');

      expect(result.message).toContain('archivé');
      expect(prismaMock.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prop-uuid-1' },
          data: expect.objectContaining({ status: PropertyStatus.ARCHIVED }),
        }),
      );
    });
  });
});
