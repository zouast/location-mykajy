import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import {
  QueryAgentListingsDto,
  QueryAgentPropertiesDto,
} from './dto/query-agent-items.dto';
import {
  AgentDetailDto,
  AgentListingItemDto,
  AgentPropertyItemDto,
} from './dto/agent-response.dto';
import { AgencyResponseDto } from '../agencies/dto/agency-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { omitPassword } from '../auth/utils/omit-password.util';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAgentByUserId(userId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { userId },
      include: {
        user: true,
        agency: true,
      },
    });

    if (!agent) {
      throw new ForbiddenException(
        "Vous ne disposez pas d'un profil d'agent immobilier",
      );
    }

    return agent;
  }

  async getMyProfile(userId: string): Promise<AgentDetailDto> {
    const agent = await this.getAgentByUserId(userId);

    return {
      ...agent,
      user: omitPassword(agent.user),
    };
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateAgentProfileDto,
  ): Promise<AgentDetailDto> {
    const agent = await this.getAgentByUserId(userId);

    const updated = await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.licenseNumber !== undefined && {
          licenseNumber: dto.licenseNumber,
        }),
        ...(dto.biography !== undefined && { biography: dto.biography }),
        ...(dto.specialties !== undefined && { specialties: dto.specialties }),
        ...(dto.yearsExperience !== undefined && {
          yearsExperience: dto.yearsExperience,
        }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
      include: {
        user: true,
        agency: true,
      },
    });

    return {
      ...updated,
      user: omitPassword(updated.user),
    };
  }

  async getMyAgency(userId: string): Promise<AgencyResponseDto> {
    const agent = await this.getAgentByUserId(userId);

    if (!agent.agency || agent.agency.deletedAt) {
      throw new NotFoundException(
        'Votre agence de rattachement est introuvable',
      );
    }

    return agent.agency;
  }

  async getMyProperties(
    userId: string,
    query: QueryAgentPropertiesDto,
  ): Promise<PaginatedResult<AgentPropertyItemDto>> {
    const agent = await this.getAgentByUserId(userId);
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      agentId: agent.id,
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { city: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: properties,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getMyListings(
    userId: string,
    query: QueryAgentListingsDto,
  ): Promise<PaginatedResult<AgentListingItemDto>> {
    const agent = await this.getAgentByUserId(userId);
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      property: {
        agentId: agent.id,
      },
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        include: {
          price: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: listings.map((l) => ({
        id: l.id,
        propertyId: l.propertyId,
        transactionType: l.transactionType,
        status: l.status,
        title: l.title,
        price: l.price?.price,
        viewsCount: l.viewsCount,
        contactCount: l.contactCount,
        createdAt: l.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
