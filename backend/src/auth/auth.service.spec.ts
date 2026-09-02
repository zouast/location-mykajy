import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { AuthMailService } from './services/auth-mail.service';

describe('AuthService', () => {
  let authService: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    avatarUrl: null,
    gender: null,
    role: Role.CLIENT,
    isActive: true,
    isVerified: false,
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
    createEmailVerificationToken: jest.fn(),
    createRefreshToken: jest.fn(),
    signAccessToken: jest.fn(),
    getAccessTokenExpiresIn: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllRefreshTokens: jest.fn(),
    createPasswordResetToken: jest.fn(),
    validatePasswordResetToken: jest.fn(),
    markPasswordResetTokenUsed: jest.fn(),
    validateEmailVerificationToken: jest.fn(),
    markEmailVerificationTokenUsed: jest.fn(),
  };

  const authMailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
        { provide: AuthMailService, useValue: authMailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a user and return auth response', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);
      tokenService.hashPassword.mockResolvedValue('hashed');
      usersService.create.mockResolvedValue(mockUser);
      tokenService.createEmailVerificationToken.mockResolvedValue(
        'verify-token',
      );
      tokenService.createRefreshToken.mockResolvedValue('refresh-token');
      tokenService.signAccessToken.mockReturnValue('access-token');
      tokenService.getAccessTokenExpiresIn.mockReturnValue('15m');

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('test@example.com');
      expect(authMailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException when email exists', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      tokenService.comparePassword.mockResolvedValue(true);
      usersService.updateLastLogin.mockResolvedValue(mockUser);
      tokenService.createRefreshToken.mockResolvedValue('refresh-token');
      tokenService.signAccessToken.mockReturnValue('access-token');
      tokenService.getAccessTokenExpiresIn.mockReturnValue('15m');

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
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
        { ...mockUser, password: undefined } as never,
        {
          currentPassword: 'old',
          newPassword: 'newpassword',
        },
      );

      expect(result.message).toContain('Password changed');
      expect(tokenService.revokeAllRefreshTokens).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('should reject when new password equals current password', async () => {
      await expect(
        authService.changePassword(
          { ...mockUser },
          {
            currentPassword: 'same',
            newPassword: 'same',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should always return generic success message', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);

      const result = await authService.forgotPassword({
        email: 'unknown@example.com',
      });

      expect(result.message).toContain('If an account exists');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      tokenService.validateEmailVerificationToken.mockResolvedValue({
        userId: 'user-1',
        user: mockUser,
      });
      usersService.markEmailVerified.mockResolvedValue({
        ...mockUser,
        isVerified: true,
      });

      const result = await authService.verifyEmail({ token: 'valid-token' });

      expect(result.message).toContain('verified');
      expect(usersService.markEmailVerified).toHaveBeenCalledWith('user-1');
    });
  });
});
