import { Test, TestingModule } from '@nestjs/testing';
import { AdminAgenciesController } from './admin-agencies.controller';
import { AgenciesService } from './agencies.service';

describe('AdminAgenciesController', () => {
  let controller: AdminAgenciesController;

  const mockAgency = {
    id: 'agency-uuid-1',
    name: 'Immo Prestige Paris',
    address: '12 Avenue Montaigne',
    city: 'Paris',
    phone: '+33140000000',
    email: 'contact@immoprestige.com',
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const agenciesServiceMock = {
    adminFindAll: jest.fn(),
    adminFindOne: jest.fn(),
    adminCreate: jest.fn(),
    adminUpdate: jest.fn(),
    adminUpdateStatus: jest.fn(),
    adminDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAgenciesController],
      providers: [{ provide: AgenciesService, useValue: agenciesServiceMock }],
    }).compile();

    controller = module.get<AdminAgenciesController>(AdminAgenciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated agencies', async () => {
      const response = {
        items: [mockAgency],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      agenciesServiceMock.adminFindAll.mockResolvedValue(response);

      const query = { page: 1, limit: 10, search: 'Prestige' } as any;
      const result = await controller.findAll(query);

      expect(result).toEqual(response);
      expect(agenciesServiceMock.adminFindAll).toHaveBeenCalledWith(query);
    });
  });

  describe('create', () => {
    it('should create agency via admin', async () => {
      const dto = {
        name: 'Immo Prestige Paris',
        address: '12 Avenue Montaigne',
        city: 'Paris',
        phone: '+33140000000',
        email: 'contact@immoprestige.com',
      };
      agenciesServiceMock.adminCreate.mockResolvedValue(mockAgency);

      const result = await controller.create(dto);

      expect(result).toEqual(mockAgency);
      expect(agenciesServiceMock.adminCreate).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update agency via admin', async () => {
      const dto = { name: 'Immo Updated' };
      agenciesServiceMock.adminUpdate.mockResolvedValue({
        ...mockAgency,
        name: 'Immo Updated',
      });

      const result = await controller.update('agency-uuid-1', dto);

      expect(result.name).toBe('Immo Updated');
      expect(agenciesServiceMock.adminUpdate).toHaveBeenCalledWith(
        'agency-uuid-1',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete agency via admin', async () => {
      const response = { message: 'Agence supprimée' };
      agenciesServiceMock.adminDelete.mockResolvedValue(response);

      const result = await controller.remove('agency-uuid-1');

      expect(result).toEqual(response);
      expect(agenciesServiceMock.adminDelete).toHaveBeenCalledWith(
        'agency-uuid-1',
      );
    });
  });
});
