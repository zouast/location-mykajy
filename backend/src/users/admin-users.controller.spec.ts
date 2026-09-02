import { Test, TestingModule } from '@nestjs/testing';
import { Gender, Role } from '@prisma/client';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from './users.service';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'admin.target@example.com',
    firstName: 'Alice',
    lastName: 'Martin',
    phone: '+33612345678',
    avatarUrl: 'https://example.com/avatar.jpg',
    gender: Gender.FEMALE,
    role: Role.CLIENT,
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const usersServiceMock = {
    findAll: jest.fn(),
    adminFindOne: jest.fn(),
    adminCreate: jest.fn(),
    adminUpdate: jest.fn(),
    adminUpdateStatus: jest.fn(),
    adminDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginatedResult = {
        items: [mockUser],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      usersServiceMock.findAll.mockResolvedValue(paginatedResult);

      const query = { page: 1, limit: 10, search: 'Alice' } as any;
      const result = await controller.findAll(query);

      expect(result).toEqual(paginatedResult);
      expect(usersServiceMock.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return user details by id', async () => {
      usersServiceMock.adminFindOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-uuid-1');

      expect(result).toEqual(mockUser);
      expect(usersServiceMock.adminFindOne).toHaveBeenCalledWith('user-uuid-1');
    });
  });

  describe('create', () => {
    it('should create user via admin', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password123',
        role: Role.AGENT,
      };
      usersServiceMock.adminCreate.mockResolvedValue({
        ...mockUser,
        ...dto,
      });

      const result = await controller.create(dto);

      expect(result.email).toBe('new@example.com');
      expect(usersServiceMock.adminCreate).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update user via admin', async () => {
      const dto = { role: Role.ADMIN, isActive: true };
      usersServiceMock.adminUpdate.mockResolvedValue({
        ...mockUser,
        ...dto,
      });

      const result = await controller.update('user-uuid-1', dto);

      expect(result.role).toBe(Role.ADMIN);
      expect(usersServiceMock.adminUpdate).toHaveBeenCalledWith(
        'user-uuid-1',
        dto,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update user active status', async () => {
      const dto = { isActive: false, reason: 'Compte suspendu' };
      usersServiceMock.adminUpdateStatus.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await controller.updateStatus('user-uuid-1', dto);

      expect(result.isActive).toBe(false);
      expect(usersServiceMock.adminUpdateStatus).toHaveBeenCalledWith(
        'user-uuid-1',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete user via admin', async () => {
      const response = { message: 'Utilisateur supprimé' };
      usersServiceMock.adminDelete.mockResolvedValue(response);

      const result = await controller.remove('user-uuid-1');

      expect(result).toEqual(response);
      expect(usersServiceMock.adminDelete).toHaveBeenCalledWith('user-uuid-1');
    });
  });
});
