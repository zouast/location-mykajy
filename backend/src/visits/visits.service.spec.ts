import { ConflictException } from '@nestjs/common';
import { VisitsService } from './visits.service';

const now = new Date();

describe('VisitsService', () => {
  it('should throw ConflictException when overlapping visit exists for same listing', async () => {
    // Mock PrismaService
    const mockPrisma: any = {
      listing: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'listing-1',
          property: { agentId: 'agent-1', ownerId: 'owner-1' },
          title: 'Test',
        }),
      },
      visit: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'v1',
            listingId: 'listing-1',
            agentId: 'agent-1',
            scheduledAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // 30min later
            duration: 30,
            status: 'PENDING',
          },
        ]),
        create: jest.fn(),
      },
      notification: { create: jest.fn() },
    };

    const service = new VisitsService(mockPrisma);

    const dto: any = {
      listingId: 'listing-1',
      scheduledAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(), // overlaps
      duration: 30,
    };

    await expect(service.create('client-1', dto)).rejects.toBeInstanceOf(ConflictException);
  });
});
