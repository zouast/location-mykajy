import { Test, TestingModule } from '@nestjs/testing';
import { AgencyAdminController } from './agency-admin.controller';
import { AgenciesService } from './agencies.service';

describe('AgencyAdminController', () => {
  let controller: AgencyAdminController;

  const mockUser = {
    id: 'user-agency-admin-1',
    email: 'admin@immoprestige.com',
  };

  const mockAgency = {
    id: 'agency-uuid-1',
    name: 'Immo Prestige Paris',
    address: '12 Avenue Montaigne',
    city: 'Paris',
    phone: '+33140000000',
    email: 'contact@immoprestige.com',
  };

  const agenciesServiceMock = {
    getMyAgency: jest.fn(),
    updateMyAgency: jest.fn(),
    getMyAgents: jest.fn(),
    addAgent: jest.fn(),
    updateAgent: jest.fn(),
    removeAgent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgencyAdminController],
      providers: [{ provide: AgenciesService, useValue: agenciesServiceMock }],
    }).compile();

    controller = module.get<AgencyAdminController>(AgencyAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyAgency', () => {
    it('should return the current agency', async () => {
      agenciesServiceMock.getMyAgency.mockResolvedValue(mockAgency);

      const result = await controller.getMyAgency(mockUser as any);

      expect(result).toEqual(mockAgency);
      expect(agenciesServiceMock.getMyAgency).toHaveBeenCalledWith(
        'user-agency-admin-1',
      );
    });
  });

  describe('addAgent', () => {
    it('should add an agent to current agency', async () => {
      const dto = {
        email: 'agent@example.com',
        password: 'password123',
        firstName: 'Lucas',
        lastName: 'Bernard',
      };
      const createdAgent = { id: 'agent-1', ...dto };
      agenciesServiceMock.addAgent.mockResolvedValue(createdAgent);

      const result = await controller.addAgent(mockUser as any, dto);

      expect(result).toEqual(createdAgent);
      expect(agenciesServiceMock.addAgent).toHaveBeenCalledWith(
        'user-agency-admin-1',
        dto,
      );
    });
  });

  describe('removeAgent', () => {
    it('should remove agent from current agency', async () => {
      const response = { message: 'Agent retiré' };
      agenciesServiceMock.removeAgent.mockResolvedValue(response);

      const result = await controller.removeAgent(mockUser as any, 'agent-1');

      expect(result).toEqual(response);
      expect(agenciesServiceMock.removeAgent).toHaveBeenCalledWith(
        'user-agency-admin-1',
        'agent-1',
      );
    });
  });
});
