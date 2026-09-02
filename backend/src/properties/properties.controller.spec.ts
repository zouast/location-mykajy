import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

describe('PropertiesController', () => {
  let controller: PropertiesController;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'OWNER',
  } as any;

  const mockProperty = {
    id: 'prop-1',
    title: 'Appartement Paris',
    area: 90,
  };

  const propertiesServiceMock = {
    getMyProperties: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        { provide: PropertiesService, useValue: propertiesServiceMock },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyProperties', () => {
    it('should return my properties', async () => {
      const response = { items: [mockProperty], meta: { total: 1 } };
      propertiesServiceMock.getMyProperties.mockResolvedValue(response);

      const result = await controller.getMyProperties(mockUser, {} as any);

      expect(result).toEqual(response);
      expect(propertiesServiceMock.getMyProperties).toHaveBeenCalledWith(
        mockUser,
        {},
      );
    });
  });

  describe('findAll', () => {
    it('should return properties list', async () => {
      const response = { items: [mockProperty], meta: { total: 1 } };
      propertiesServiceMock.findAll.mockResolvedValue(response);

      const result = await controller.findAll({} as any, mockUser);

      expect(result).toEqual(response);
      expect(propertiesServiceMock.findAll).toHaveBeenCalledWith({}, mockUser);
    });
  });

  describe('findOne', () => {
    it('should return property by id', async () => {
      propertiesServiceMock.findOne.mockResolvedValue(mockProperty);

      const result = await controller.findOne('prop-1', mockUser);

      expect(result).toEqual(mockProperty);
      expect(propertiesServiceMock.findOne).toHaveBeenCalledWith(
        'prop-1',
        mockUser,
      );
    });
  });

  describe('create', () => {
    it('should create property', async () => {
      const dto = { title: 'Appartement Paris', area: 90 } as any;
      propertiesServiceMock.create.mockResolvedValue(mockProperty);

      const result = await controller.create(mockUser, dto);

      expect(result).toEqual(mockProperty);
      expect(propertiesServiceMock.create).toHaveBeenCalledWith(mockUser, dto);
    });
  });

  describe('update', () => {
    it('should update property', async () => {
      const dto = { title: 'Appartement Paris Modifié' };
      propertiesServiceMock.update.mockResolvedValue({
        ...mockProperty,
        ...dto,
      });

      const result = await controller.update(mockUser, 'prop-1', dto);

      expect(result.title).toBe('Appartement Paris Modifié');
      expect(propertiesServiceMock.update).toHaveBeenCalledWith(
        mockUser,
        'prop-1',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('should remove property', async () => {
      const response = { message: 'Bien archivé' };
      propertiesServiceMock.remove.mockResolvedValue(response);

      const result = await controller.remove(mockUser, 'prop-1');

      expect(result).toEqual(response);
      expect(propertiesServiceMock.remove).toHaveBeenCalledWith(
        mockUser,
        'prop-1',
      );
    });
  });
});
