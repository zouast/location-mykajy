import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaType, Role } from '@prisma/client';
import { MediaService } from './media.service';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';

describe('MediaService', () => {
  let service: MediaService;

  const mockOwnerUser = { id: 'user-owner-1', role: Role.OWNER } as any;
  const mockAdminUser = { id: 'user-admin-1', role: Role.ADMIN } as any;

  const mockProperty = {
    id: 'property-1',
    ownerId: 'owner-profile-1',
    agentId: 'agent-profile-1',
    agencyId: 'agency-1',
  };

  const mockMedia = {
    id: 'media-1',
    propertyId: 'property-1',
    url: 'https://cdn.example.com/properties/photos/salon.jpg',
    type: MediaType.IMAGE,
    title: 'Salon lumineux',
    description: null,
    isPrimary: false,
    sortOrder: 0,
    createdAt: new Date(),
  };

  const prismaMock = {
    property: { findUnique: jest.fn() },
    owner: { findUnique: jest.fn() },
    agent: { findUnique: jest.fn() },
    propertyMedia: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const storageMock = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: StorageService, useValue: storageMock },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  describe('upload', () => {
    it('should upload image and persist URL for authorized OWNER', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      storageMock.upload.mockResolvedValue({
        key: 'properties/photos/123-salon.jpg',
        url: 'https://cdn.example.com/properties/photos/123-salon.jpg',
      });
      prismaMock.propertyMedia.create.mockResolvedValue(mockMedia);

      const mockFile: Express.Multer.File = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        originalname: 'salon.jpg',
        size: 1024,
      } as any;

      const result = await service.upload(
        mockOwnerUser,
        'property-1',
        mockFile,
        {
          type: MediaType.IMAGE,
          title: 'Salon lumineux',
        },
      );

      expect(result.url).toBe(mockMedia.url);
      expect(storageMock.upload).toHaveBeenCalled();
      expect(prismaMock.propertyMedia.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            url: expect.any(String),
            type: MediaType.IMAGE,
          }),
        }),
      );
    });

    it('should reject invalid MIME type for IMAGE', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });

      const mockFile = {
        buffer: Buffer.from('fake'),
        mimetype: 'application/zip',
        originalname: 'archive.zip',
        size: 500,
      } as Express.Multer.File;

      await expect(
        service.upload(mockOwnerUser, 'property-1', mockFile, {
          type: MediaType.IMAGE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for OWNER on another user property', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({
        id: 'different-owner-999',
      });

      const mockFile = {
        buffer: Buffer.from(''),
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
        size: 100,
      } as Express.Multer.File;

      await expect(
        service.upload(mockOwnerUser, 'property-1', mockFile, {
          type: MediaType.IMAGE,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByProperty', () => {
    it('should return medias ordered by sortOrder', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.propertyMedia.findMany.mockResolvedValue([mockMedia]);

      const result = await service.findAllByProperty('property-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('media-1');
    });

    it('should throw NotFoundException for unknown property', async () => {
      prismaMock.property.findUnique.mockResolvedValue(null);

      await expect(service.findAllByProperty('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setPrimary', () => {
    it('should atomically set a media as primary and unset others', async () => {
      prismaMock.propertyMedia.findUnique.mockResolvedValue(mockMedia);
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      prismaMock.$transaction.mockResolvedValue([
        { count: 1 },
        { ...mockMedia, isPrimary: true },
      ]);

      const result = await service.setPrimary(mockOwnerUser, 'media-1');

      expect(result.isPrimary).toBe(true);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should reject setting a non-IMAGE media as primary', async () => {
      prismaMock.propertyMedia.findUnique.mockResolvedValue({
        ...mockMedia,
        type: MediaType.DOCUMENT,
      });

      await expect(
        service.setPrimary(mockOwnerUser, 'media-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reorder', () => {
    it('should update sortOrder for all medias in transaction', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      prismaMock.propertyMedia.findMany.mockResolvedValueOnce([
        { id: 'media-1' },
        { id: 'media-2' },
      ]);
      prismaMock.$transaction.mockResolvedValue([]);
      // findAllByProperty after reorder
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.propertyMedia.findMany.mockResolvedValue([
        { ...mockMedia, sortOrder: 0 },
        { ...mockMedia, id: 'media-2', sortOrder: 1 },
      ]);

      const result = await service.reorder(mockOwnerUser, 'property-1', {
        orderedIds: ['media-1', 'media-2'],
      });

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should throw BadRequestException for invalid media IDs', async () => {
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      prismaMock.propertyMedia.findMany.mockResolvedValue([{ id: 'media-1' }]);

      await expect(
        service.reorder(mockOwnerUser, 'property-1', {
          orderedIds: ['media-1', 'unknown-media-999'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete media from storage and database', async () => {
      prismaMock.propertyMedia.findUnique.mockResolvedValue(mockMedia);
      prismaMock.property.findUnique.mockResolvedValue(mockProperty);
      prismaMock.owner.findUnique.mockResolvedValue({ id: 'owner-profile-1' });
      storageMock.delete.mockResolvedValue(undefined);
      prismaMock.propertyMedia.delete.mockResolvedValue(mockMedia);

      const result = await service.remove(mockOwnerUser, 'media-1');

      expect(result.message).toContain('supprimé');
      expect(storageMock.delete).toHaveBeenCalled();
      expect(prismaMock.propertyMedia.delete).toHaveBeenCalledWith({
        where: { id: 'media-1' },
      });
    });

    it('should throw NotFoundException for unknown media', async () => {
      prismaMock.propertyMedia.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockAdminUser, 'unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
