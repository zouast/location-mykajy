import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Gender, Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { TokenService } from '../auth/services/token.service';
import { AuthMailService } from '../auth/services/auth-mail.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+33612345678',
    avatarUrl: 'https://example.com/avatar.jpg',
    gender: Gender.MALE,
    role: Role.CLIENT,
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    clientProfile: null,
    agentProfile: null,
    ownerProfile: null,
  };

  const prismaMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const tokenServiceMock = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    createEmailVerificationToken: jest.fn(),
    revokeAllRefreshTokens: jest.fn(),
  };

  const authMailServiceMock = {
    sendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: AuthMailService, useValue: authMailServiceMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-uuid-1');

      expect(result.id).toBe('user-uuid-1');
      expect(result.email).toBe('test@example.com');
      expect((result as any).password).toBeUndefined();
    });

    it('should throw NotFoundException if user not found or deleted', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update name and gender', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Pierre',
        lastName: 'Durand',
        gender: Gender.OTHER,
      });

      const result = await service.updateProfile('user-uuid-1', {
        firstName: 'Pierre',
        lastName: 'Durand',
        gender: Gender.OTHER,
      });

      expect(result.firstName).toBe('Pierre');
      expect(result.lastName).toBe('Durand');
      expect(result.gender).toBe(Gender.OTHER);
    });
  });

  describe('updatePhone', () => {
    it('should update phone number', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        phone: '+33700000000',
      });

      const result = await service.updatePhone('user-uuid-1', {
        phone: '+33700000000',
      });

      expect(result.phone).toBe('+33700000000');
    });
  });

  describe('updateEmail', () => {
    it('should update email, mark isVerified as false and send verification email', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser) // findOneByIdWithPassword
        .mockResolvedValueOnce(null); // check email uniqueness

      tokenServiceMock.comparePassword.mockResolvedValue(true);
      tokenServiceMock.createEmailVerificationToken.mockResolvedValue(
        'token-123',
      );

      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        email: 'new@example.com',
        isVerified: false,
      });

      const result = await service.updateEmail('user-uuid-1', {
        newEmail: 'new@example.com',
        currentPassword: 'hashed-password',
      });

      expect(result.user.email).toBe('new@example.com');
      expect(result.user.isVerified).toBe(false);
      expect(authMailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
        'new@example.com',
        'token-123',
      );
    });

    it('should reject if current password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      tokenServiceMock.comparePassword.mockResolvedValue(false);

      await expect(
        service.updateEmail('user-uuid-1', {
          newEmail: 'new@example.com',
          currentPassword: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject if new email equals current email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      tokenServiceMock.comparePassword.mockResolvedValue(true);

      await expect(
        service.updateEmail('user-uuid-1', {
          newEmail: 'test@example.com',
          currentPassword: 'password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if new email is taken by another user', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          id: 'user-uuid-2',
          email: 'taken@example.com',
        });

      tokenServiceMock.comparePassword.mockResolvedValue(true);

      await expect(
        service.updateEmail('user-uuid-1', {
          newEmail: 'taken@example.com',
          currentPassword: 'password',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar URL', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        avatarUrl: 'https://example.com/new-avatar.jpg',
      });

      const result = await service.updateAvatar('user-uuid-1', {
        avatarUrl: 'https://example.com/new-avatar.jpg',
      });

      expect(result.avatarUrl).toBe('https://example.com/new-avatar.jpg');
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate user, mark deletedAt and revoke all refresh tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      tokenServiceMock.comparePassword.mockResolvedValue(true);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
        deletedAt: new Date(),
      });

      const result = await service.deactivateAccount('user-uuid-1', {
        password: 'valid-password',
      });

      expect(result.message).toContain('désactivé');
      expect(tokenServiceMock.revokeAllRefreshTokens).toHaveBeenCalledWith(
        'user-uuid-1',
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it('should reject if confirmation password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      tokenServiceMock.comparePassword.mockResolvedValue(false);

      await expect(
        service.deactivateAccount('user-uuid-1', {
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Admin findAll', () => {
    it('should return paginated list of users with metadata', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.user.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        search: 'dupont',
      } as any);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });
  });

  describe('Admin adminCreate', () => {
    it('should create a new user with hashed password and role', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      tokenServiceMock.hashPassword.mockResolvedValue('hashed');
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        role: Role.AGENT,
      });

      const result = await service.adminCreate({
        email: 'agent@example.com',
        password: 'password123',
        role: Role.AGENT,
      });

      expect(result.role).toBe(Role.AGENT);
      expect(tokenServiceMock.hashPassword).toHaveBeenCalledWith('password123');
    });

    it('should reject if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.adminCreate({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Admin adminUpdateStatus', () => {
    it('should toggle active status and revoke tokens if deactivated', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.adminUpdateStatus('user-uuid-1', {
        isActive: false,
      });

      expect(result.isActive).toBe(false);
      expect(tokenServiceMock.revokeAllRefreshTokens).toHaveBeenCalledWith(
        'user-uuid-1',
      );
    });
  });

  describe('Admin adminDelete', () => {
    it('should soft-delete user and revoke tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
        deletedAt: new Date(),
      });

      const result = await service.adminDelete('user-uuid-1');

      expect(result.message).toContain('supprimé');
      expect(tokenServiceMock.revokeAllRefreshTokens).toHaveBeenCalledWith(
        'user-uuid-1',
      );
    });
  });
});
