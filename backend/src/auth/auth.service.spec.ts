import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { AuthMailService } from './services/auth-mail.service';
import { PrismaService } from '../database/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    avatarUrl: null,
    gender: null,
    role: Role.LOCATAIRE,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: false,
    isActive: true,
    isVerified: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const usersService = {
    create: jest.fn(),
    findOneByEmail: jest.fn(),
    findOneByIdWithPassword: jest.fn(),
    updatePassword: jest.fn(),
    markEmailVerified: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const tokenService = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    generateOpaqueToken: jest.fn().mockReturnValue('opaque-token'),
    hashToken: jest.fn().mockReturnValue('token-hash'),
    getEmailVerificationExpiresAt: jest.fn().mockReturnValue(new Date(Date.now() + 86400000)),
    createRefreshToken: jest.fn(),
    signAccessToken: jest.fn(),
    getAccessTokenExpiresIn: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllRefreshTokens: jest.fn(),
    createPasswordResetToken: jest.fn(),
    validatePasswordResetToken: jest.fn(),
    markPasswordResetTokenUsed: jest.fn(),
  };

  const authMailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(prismaMock)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
        { provide: AuthMailService, useValue: authMailService },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a user and return register response without tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      tokenService.hashPassword.mockResolvedValue('hashed');
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
        role: Role.LOCATAIRE,
        acceptTerms: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(authMailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException when email exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'Password123!',
          passwordConfirmation: 'Password123!',
          role: Role.LOCATAIRE,
          acceptTerms: true,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login with valid credentials and verified email', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      tokenService.comparePassword.mockResolvedValue(true);
      usersService.updateLastLogin.mockResolvedValue(mockUser);
      tokenService.createRefreshToken.mockResolvedValue('refresh-token');
      tokenService.signAccessToken.mockReturnValue('access-token');
      tokenService.getAccessTokenExpiresIn.mockReturnValue('15m');

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.tokens.accessToken).toBe('access-token');
      expect(usersService.updateLastLogin).toHaveBeenCalledWith('user-1');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      tokenService.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should change password when current password is valid', async () => {
      usersService.findOneByIdWithPassword.mockResolvedValue(mockUser);
      tokenService.comparePassword.mockResolvedValue(true);
      tokenService.hashPassword.mockResolvedValue('new-hash');
      usersService.updatePassword.mockResolvedValue(mockUser);

      const result = await authService.changePassword(
        { ...mockUser } as never,
        {
          currentPassword: 'old',
          newPassword: 'newpassword',
        },
      );

      expect(result.success).toBe(true);
      expect(tokenService.revokeAllRefreshTokens).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('should reject when new password equals current password', async () => {
      await expect(
        authService.changePassword(
          { ...mockUser } as never,
          {
            currentPassword: 'same',
            newPassword: 'same',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token in transaction', async () => {
      prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        usedAt: null,
        user: { ...mockUser, emailVerified: false },
      });

      const result = await authService.verifyEmail({ token: 'valid-token' });

      expect(result.success).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            emailVerified: true,
            status: UserStatus.ACTIVE,
          }),
        }),
      );
    });
  });
});
