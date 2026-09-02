import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ListingStatus, Role, TransactionType } from '@prisma/client';
import { ListingsService } from './listings.service';
import { PrismaService } from '../database/prisma.service';

describe('ListingsService', () => {
  let service: ListingsService;

  const mockAdmin = { id: 'admin-1', role: Role.ADMIN } as any;
  const mockOwner = { id: 'owner-user-1', role: Role.OWNER } as any;
  const mockAgent = { id: 'agent-user-1', role: Role.AGENT } as any;

  const mockProperty = {
    id: 'property-1',
    title: 'Appartement Paris',
    ownerId: 'owner-profile-1',
    agentId: 'agent-profile-1',
    agencyId: 'agency-1',
    area: 80,
  };

  const makeListing = (status: ListingStatus) => ({
    id: 'listing-1',
    propertyId: 'property-1',
    transactionType: TransactionType.RENT,
    status,
    visibility: 'PUBLIC',
    title: 'Appartement Paris',
    description: 'Bel appartement',
    slug: 'appartement-paris-12345',
    viewsCount: 0,
    isFeatured: false,
    publishedAt: null,
    expiresAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    price: {
      price: 1500,
      currency: 'EUR',
      isNegotiable: false,
      chargesIncluded: false,
    },
    property: {
      ownerId: 'owner-profile-1',
      agentId: 'agent-profile-1',
      agencyId: 'agency-1',
    },
  });

  const prismaMock = {
    listing: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    property: { findUnique: jest.fn() },
    owner: { findUnique: jest.fn() },
    agent: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
  });

  describe('create', () => {
    it('should create a listing in DRAFT for authorized OWNER', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      prismaMock.listing.create.mockResolvedValue(
        makeListing(ListingStatus.DRAFT),
      );

      const result = await service.create(mockOwner, {
        propertyId: 'property-1',
        transactionType: TransactionType.RENT,
        price: 1500,
      });

      expect(result.status).toBe(ListingStatus.DRAFT);
      expect(prismaMock.listing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ListingStatus.DRAFT }),
        }),
      );
    });

    it('should throw ForbiddenException for OWNER on another property', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'different-owner' });

      await expect(
        service.create(mockOwner, {
          propertyId: 'property-1',
          transactionType: TransactionType.RENT,
          price: 1500,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Workflow Transitions', () => {
    it('DRAFT → PENDING_REVIEW: OWNER can submit for review', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.DRAFT),
      );
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      prismaMock.listing.update.mockResolvedValue(
        makeListing(ListingStatus.PENDING_REVIEW),
      );

      const result = await service.submit(mockOwner, 'listing-1');
      expect(result.status).toBe(ListingStatus.PENDING_REVIEW);
    });

    it('PENDING_REVIEW → ACTIVE: Only ADMIN can publish', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.PENDING_REVIEW),
      );
      prismaMock.listing.update.mockResolvedValue(
        makeListing(ListingStatus.ACTIVE),
      );

      const result = await service.publish(mockAdmin, 'listing-1');
      expect(result.status).toBe(ListingStatus.ACTIVE);
    });

    it('PENDING_REVIEW → ACTIVE: OWNER cannot publish (admin-only)', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.PENDING_REVIEW),
      );
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });

      await expect(service.publish(mockOwner, 'listing-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('DRAFT → ACTIVE: Direct transition is forbidden for anyone', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.DRAFT),
      );
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });

      await expect(service.publish(mockOwner, 'listing-1')).rejects.toThrow();
    });

    it('ACTIVE → PAUSED: OWNER can pause their listing', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.ACTIVE),
      );
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      prismaMock.listing.update.mockResolvedValue(
        makeListing(ListingStatus.PAUSED),
      );

      const result = await service.pause(mockOwner, 'listing-1');
      expect(result.status).toBe(ListingStatus.PAUSED);
    });

    it('PAUSED → ACTIVE: OWNER can resume a paused listing', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.PAUSED),
      );
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      prismaMock.listing.update.mockResolvedValue(
        makeListing(ListingStatus.ACTIVE),
      );

      const result = await service.resume(mockOwner, 'listing-1');
      expect(result.status).toBe(ListingStatus.ACTIVE);
    });

    it('COMPLETED → any: Terminal state blocks all transitions', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.COMPLETED),
      );

      await expect(service.pause(mockAdmin, 'listing-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('PENDING_REVIEW → CANCELLED: ADMIN can reject', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.PENDING_REVIEW),
      );
      prismaMock.listing.update.mockResolvedValue(
        makeListing(ListingStatus.CANCELLED),
      );

      const result = await service.reject(
        mockAdmin,
        'listing-1',
        'Prix incorrect',
      );
      expect(result.status).toBe(ListingStatus.CANCELLED);
    });
  });

  describe('findOne', () => {
    it('should return active listing and increment view count', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.ACTIVE),
      );
      prismaMock.listing.update.mockResolvedValue({
        ...makeListing(ListingStatus.ACTIVE),
        viewsCount: 1,
      });

      const result = await service.findOne('listing-1');
      expect(result.viewsCount).toBe(1);
    });

    it('should hide non-active listings from anonymous users', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.DRAFT),
      );

      await expect(service.findOne('listing-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('archive', () => {
    it('should soft-delete and mark as CANCELLED', async () => {
      prismaMock.listing.findUnique.mockResolvedValue(
        makeListing(ListingStatus.ACTIVE),
      );
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      prismaMock.listing.update.mockResolvedValue({
        ...makeListing(ListingStatus.CANCELLED),
        deletedAt: new Date(),
      });

      const result = await service.archive(mockOwner, 'listing-1');
      expect(result.message).toContain('archivée');
      expect(prismaMock.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ListingStatus.CANCELLED,
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });
  });
});
