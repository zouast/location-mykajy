import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

describe('AgentsController', () => {
  let controller: AgentsController;

  const mockUser = {
    id: 'user-agent-1',
    email: 'agent@immoprestige.com',
  };

  const mockAgentDetail = {
    id: 'agent-1',
    userId: 'user-agent-1',
    agencyId: 'agency-1',
    title: 'Conseiller',
  };

  const agentsServiceMock = {
    getMyProfile: jest.fn(),
    updateMyProfile: jest.fn(),
    getMyAgency: jest.fn(),
    getMyProperties: jest.fn(),
    getMyListings: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [{ provide: AgentsService, useValue: agentsServiceMock }],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyProfile', () => {
    it('should return agent profile', async () => {
      agentsServiceMock.getMyProfile.mockResolvedValue(mockAgentDetail);

      const result = await controller.getMyProfile(mockUser as any);

      expect(result).toEqual(mockAgentDetail);
      expect(agentsServiceMock.getMyProfile).toHaveBeenCalledWith(
        'user-agent-1',
      );
    });
  });

  describe('updateMyProfile', () => {
    it('should update agent profile', async () => {
      const dto = { title: 'Senior' };
      agentsServiceMock.updateMyProfile.mockResolvedValue({
        ...mockAgentDetail,
        title: 'Senior',
      });

      const result = await controller.updateMyProfile(mockUser as any, dto);

      expect(result.title).toBe('Senior');
      expect(agentsServiceMock.updateMyProfile).toHaveBeenCalledWith(
        'user-agent-1',
        dto,
      );
    });
  });

  describe('getMyAgency', () => {
    it('should return agent agency', async () => {
      const agency = { id: 'agency-1', name: 'Immo Prestige' };
      agentsServiceMock.getMyAgency.mockResolvedValue(agency);

      const result = await controller.getMyAgency(mockUser as any);

      expect(result).toEqual(agency);
      expect(agentsServiceMock.getMyAgency).toHaveBeenCalledWith(
        'user-agent-1',
      );
    });
  });

  describe('getMyProperties', () => {
    it('should return agent properties', async () => {
      const response = { items: [], meta: { total: 0 } };
      agentsServiceMock.getMyProperties.mockResolvedValue(response);

      const result = await controller.getMyProperties(
        mockUser as any,
        {} as any,
      );

      expect(result).toEqual(response);
      expect(agentsServiceMock.getMyProperties).toHaveBeenCalledWith(
        'user-agent-1',
        {},
      );
    });
  });

  describe('getMyListings', () => {
    it('should return agent listings', async () => {
      const response = { items: [], meta: { total: 0 } };
      agentsServiceMock.getMyListings.mockResolvedValue(response);

      const result = await controller.getMyListings(mockUser as any, {} as any);

      expect(result).toEqual(response);
      expect(agentsServiceMock.getMyListings).toHaveBeenCalledWith(
        'user-agent-1',
        {},
      );
    });
  });
});
