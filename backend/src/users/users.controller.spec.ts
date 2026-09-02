import { Test, TestingModule } from '@nestjs/testing';
import { Gender, Role } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
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
  };

  const usersServiceMock = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    updatePhone: jest.fn(),
    updateEmail: jest.fn(),
    updateAvatar: jest.fn(),
    deactivateAccount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return the current user profile', async () => {
      usersServiceMock.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
      expect(usersServiceMock.getProfile).toHaveBeenCalledWith('user-uuid-1');
    });
  });

  describe('updateProfile', () => {
    it('should call updateProfile on service', async () => {
      const dto = { firstName: 'Pierre', lastName: 'Durand' };
      usersServiceMock.updateProfile.mockResolvedValue({
        ...mockUser,
        ...dto,
      });

      const result = await controller.updateProfile(mockUser, dto);

      expect(result.firstName).toBe('Pierre');
      expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(
        'user-uuid-1',
        dto,
      );
    });
  });

  describe('updatePhone', () => {
    it('should call updatePhone on service', async () => {
      const dto = { phone: '+33700000000' };
      usersServiceMock.updatePhone.mockResolvedValue({
        ...mockUser,
        ...dto,
      });

      const result = await controller.updatePhone(mockUser, dto);

      expect(result.phone).toBe('+33700000000');
      expect(usersServiceMock.updatePhone).toHaveBeenCalledWith(
        'user-uuid-1',
        dto,
      );
    });
  });

  describe('updateEmail', () => {
    it('should call updateEmail on service', async () => {
      const dto = {
        newEmail: 'new@example.com',
        currentPassword: 'password123',
      };
      const response = {
        user: { ...mockUser, email: 'new@example.com' },
        message: 'Email updated',
      };
      usersServiceMock.updateEmail.mockResolvedValue(response);

      const result = await controller.updateEmail(mockUser, dto);

      expect(result).toEqual(response);
      expect(usersServiceMock.updateEmail).toHaveBeenCalledWith(
        'user-uuid-1',
        dto,
      );
    });
  });

  describe('updateAvatar', () => {
    it('should call updateAvatar on service', async () => {
      const dto = { avatarUrl: 'https://example.com/new-pic.jpg' };
      usersServiceMock.updateAvatar.mockResolvedValue({
        ...mockUser,
        avatarUrl: dto.avatarUrl,
      });

      const result = await controller.updateAvatar(mockUser, dto);

      expect(result.avatarUrl).toBe(dto.avatarUrl);
      expect(usersServiceMock.updateAvatar).toHaveBeenCalledWith(
        'user-uuid-1',
        dto,
      );
    });
  });

  describe('deactivateAccount', () => {
    it('should call deactivateAccount on service', async () => {
      const dto = { password: 'password123' };
      const response = { message: 'Compte désactivé' };
      usersServiceMock.deactivateAccount.mockResolvedValue(response);

      const result = await controller.deactivateAccount(mockUser, dto);

      expect(result).toEqual(response);
      expect(usersServiceMock.deactivateAccount).toHaveBeenCalledWith(
        'user-uuid-1',
        dto,
      );
    });
  });
});
