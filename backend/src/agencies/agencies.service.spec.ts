import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { PrismaService } from '../database/prisma.service';
import { TokenService } from '../auth/services/token.service';

describe('AgenciesService', () => {
  let service: AgenciesService;

  const mockAgency = {
    id: 'agency-uuid-1',
    name: 'Immo Prestige Paris',
    legalName: 'Immo Prestige SAS',
    siret: '12345678901234',
    logoUrl: 'https://example.com/logo.png',
    bannerUrl: 'https://example.com/banner.png',
    description: 'Description prestige',
    address: '12 Avenue Montaigne',
    city: 'Paris',
    zipCode: '75008',
    phone: '+33140000000',
    email: 'contact@immoprestige.com',
    website: 'https://immoprestige.com',
    licenseNumber: 'CPI75012020000000001',
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    agents: [],
    _count: {
      agents: 2,
      properties: 5,
    },
  };

  const prismaMock = {
    agency: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    agent: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    listing: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const tokenServiceMock = {
    hashPassword: jest.fn(),
    revokeAllRefreshTokens: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgenciesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TokenService, useValue: tokenServiceMock },
      ],
    }).compile();

    service = module.get<AgenciesService>(AgenciesService);
  });

  describe('adminCreate', () => {
    it('should create an agency if email and siret are unique', async () => {
      prismaMock.agency.findUnique.mockResolvedValue(null);
      prismaMock.agency.create.mockResolvedValue(mockAgency);

      const result = await service.adminCreate({
        name: 'Immo Prestige Paris',
        address: '12 Avenue Montaigne',
        city: 'Paris',
        phone: '+33140000000',
        email: 'contact@immoprestige.com',
        siret: '12345678901234',
      });

      expect(result.name).toBe('Immo Prestige Paris');
      expect(prismaMock.agency.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      prismaMock.agency.findUnique.mockResolvedValueOnce(mockAgency);

      await expect(
        service.adminCreate({
          name: 'Immo Prestige Paris',
          address: '12 Avenue Montaigne',
          city: 'Paris',
          phone: '+33140000000',
          email: 'contact@immoprestige.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('adminUpdate', () => {
    it('should update agency fields', async () => {
      prismaMock.agency.findUnique
        .mockResolvedValueOnce(mockAgency) // ensure exists
        .mockResolvedValueOnce(null); // check email unique
      prismaMock.agency.update.mockResolvedValue({
        ...mockAgency,
        name: 'Immo Luxe Paris',
      });

      const result = await service.adminUpdate('agency-uuid-1', {
        name: 'Immo Luxe Paris',
      });

      expect(result.name).toBe('Immo Luxe Paris');
    });
  });

  describe('adminDelete', () => {
    it('should soft-delete agency', async () => {
      prismaMock.agency.findUnique.mockResolvedValue(mockAgency);
      prismaMock.agency.update.mockResolvedValue({
        ...mockAgency,
        isActive: false,
        deletedAt: new Date(),
      });

      const result = await service.adminDelete('agency-uuid-1');

      expect(result.message).toContain('désactivée');
      expect(prismaMock.agency.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'agency-uuid-1' },
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });

  describe('AgencyAdmin addAgent', () => {
    it('should add agent linked to agency', async () => {
      prismaMock.agent.findUnique.mockResolvedValue({
        agencyId: 'agency-uuid-1',
      });
      prismaMock.user.findUnique.mockResolvedValue(null);
      tokenServiceMock.hashPassword.mockResolvedValue('hashed');

      const mockCreatedAgent = {
        id: 'agent-1',
        userId: 'user-agent-1',
        agencyId: 'agency-uuid-1',
        title: 'Conseiller',
        user: {
          id: 'user-agent-1',
          email: 'agent@example.com',
          password: 'hashed',
        },
      };

      prismaMock.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: { create: jest.fn().mockResolvedValue(mockCreatedAgent.user) },
          agent: { create: jest.fn().mockResolvedValue(mockCreatedAgent) },
        });
      });

      const result = await service.addAgent('user-admin-1', {
        email: 'agent@example.com',
        password: 'password123',
        firstName: 'Lucas',
        lastName: 'Bernard',
        title: 'Conseiller',
      });

      expect(result.title).toBe('Conseiller');
      expect(result.user.email).toBe('agent@example.com');
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw ForbiddenException if current user has no agency', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(null);

      await expect(
        service.addAgent('user-without-agency', {
          email: 'agent@example.com',
          password: 'password123',
          firstName: 'Lucas',
          lastName: 'Bernard',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('AgencyAdmin removeAgent', () => {
    it('should deactivate agent and revoke tokens', async () => {
      prismaMock.agent.findUnique
        .mockResolvedValueOnce({ agencyId: 'agency-uuid-1' }) // getAgencyIdForUser
        .mockResolvedValueOnce({
          id: 'agent-1',
          agencyId: 'agency-uuid-1',
          userId: 'user-agent-1',
        }); // find agent to delete

      prismaMock.user.update.mockResolvedValue({
        id: 'user-agent-1',
        isActive: false,
      });

      const result = await service.removeAgent('user-admin-1', 'agent-1');

      expect(result.message).toContain('retiré');
      expect(tokenServiceMock.revokeAllRefreshTokens).toHaveBeenCalledWith(
        'user-agent-1',
      );
    });
  });
});
