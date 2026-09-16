import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { TokenService } from '../auth/services/token.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { AgencyAdminUpdateAgencyDto } from './dto/agency-admin-update.dto';
import { QueryAgenciesDto } from './dto/query-agencies.dto';
import { CreateAgencyAgentDto } from './dto/create-agency-agent.dto';
import { UpdateAgencyAgentDto } from './dto/update-agency-agent.dto';
import {
  AgencyAgentItemDto,
  AgencyDetailResponseDto,
  AgencyResponseDto,
} from './dto/agency-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { omitPassword } from '../auth/utils/omit-password.util';

@Injectable()
export class AgenciesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  async getAgencyIdForUser(userId: string): Promise<string> {
    const agent = await this.prisma.agent.findUnique({
      where: { userId },
      select: { agencyId: true },
    });

    if (!agent?.agencyId) {
      throw new ForbiddenException(
        "Vous n'êtes rattaché à aucune agence immobilière",
      );
    }

    return agent.agencyId;
  }

  private async ensureAgencyExists(id: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
    });

    if (!agency || agency.deletedAt) {
      throw new NotFoundException('Agence immobilière non trouvée');
    }

    return agency;
  }

  // ── SUPER ADMIN ───────────────────────────────────────────────────────────

  async adminCreate(dto: CreateAgencyDto): Promise<AgencyResponseDto> {
    const existingEmail = await this.prisma.agency.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException(
        'Une agence avec cette adresse email existe déjà',
      );
    }

    if (dto.siret) {
      const existingSiret = await this.prisma.agency.findUnique({
        where: { siret: dto.siret },
      });
      if (existingSiret) {
        throw new ConflictException(
          'Une agence avec ce numéro SIRET existe déjà',
        );
      }
    }

    return this.prisma.agency.create({
      data: {
        name: dto.name,
        legalName: dto.legalName,
        siret: dto.siret,
        logoUrl: dto.logoUrl,
        bannerUrl: dto.bannerUrl,
        description: dto.description,
        address: dto.address,
        city: dto.city,
        zipCode: dto.zipCode,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        licenseNumber: dto.licenseNumber,
        isVerified: dto.isVerified ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async adminUpdate(
    id: string,
    dto: UpdateAgencyDto,
  ): Promise<AgencyResponseDto> {
    await this.ensureAgencyExists(id);

    if (dto.email) {
      const existingEmail = await this.prisma.agency.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException(
          "Cette adresse email d'agence est déjà utilisée",
        );
      }
    }

    if (dto.siret) {
      const existingSiret = await this.prisma.agency.findUnique({
        where: { siret: dto.siret },
      });
      if (existingSiret && existingSiret.id !== id) {
        throw new ConflictException('Ce numéro SIRET est déjà utilisé');
      }
    }

    return this.prisma.agency.update({
      where: { id },
      data: dto,
    });
  }

  async adminUpdateStatus(
    id: string,
    isActive: boolean,
  ): Promise<AgencyResponseDto> {
    await this.ensureAgencyExists(id);

    return this.prisma.agency.update({
      where: { id },
      data: { isActive },
    });
  }

  async adminDelete(id: string): Promise<{ message: string }> {
    await this.ensureAgencyExists(id);

    await this.prisma.agency.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Agence désactivée et marquée comme supprimée avec succès.',
    };
  }

  async adminFindAll(
    query: QueryAgenciesDto,
  ): Promise<PaginatedResult<AgencyResponseDto>> {
    const {
      page = 1,
      limit = 10,
      city,
      isActive,
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.AgencyWhereInput = {
      deletedAt: null,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(isActive !== undefined && { isActive }),
      ...(isVerified !== undefined && { isVerified }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { siret: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [agencies, total] = await Promise.all([
      this.prisma.agency.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.agency.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: agencies,
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

  async adminFindOne(id: string): Promise<AgencyDetailResponseDto> {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        agents: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            agents: true,
            properties: true,
          },
        },
      },
    });

    if (!agency || agency.deletedAt) {
      throw new NotFoundException('Agence immobilière non trouvée');
    }

    const { _count, agents, ...agencyData } = agency;

    const listingsCount = await this.prisma.listing.count({
      where: {
        property: {
          agencyId: id,
        },
      },
    });

    return {
      ...agencyData,
      stats: {
        agentsCount: _count.agents,
        propertiesCount: _count.properties,
        listingsCount,
      },
      agents: agents.map((agent) => ({
        ...agent,
        user: omitPassword(agent.user),
      })),
    };
  }

  // ── PUBLIC ────────────────────────────────────────────────────────────────

  async findAllPublic(
    query: QueryAgenciesDto,
  ): Promise<PaginatedResult<AgencyResponseDto>> {
    const {
      page = 1,
      limit = 10,
      city,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.AgencyWhereInput = {
      deletedAt: null,
      isActive: true,
      isVerified: true,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [agencies, total] = await Promise.all([
      this.prisma.agency.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.agency.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: agencies,
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

  async findOnePublic(id: string): Promise<AgencyDetailResponseDto> {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        agents: {
          where: {
            isAvailable: true,
            user: { isActive: true, deletedAt: null },
          },
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            agents: true,
            properties: true,
          },
        },
      },
    });

    if (!agency || agency.deletedAt || !agency.isActive) {
      throw new NotFoundException('Agence immobilière non trouvée');
    }

    const { _count, agents, ...agencyData } = agency;

    const listingsCount = await this.prisma.listing.count({
      where: {
        property: {
          agencyId: id,
        },
        status: 'ACTIVE',
      },
    });

    return {
      ...agencyData,
      stats: {
        agentsCount: _count.agents,
        propertiesCount: _count.properties,
        listingsCount,
      },
      agents: agents.map((agent) => ({
        ...agent,
        user: omitPassword(agent.user),
      })),
    };
  }

  // ── AGENCY_ADMIN ──────────────────────────────────────────────────────────

  async getMyAgency(userId: string): Promise<AgencyDetailResponseDto> {
    const agencyId = await this.getAgencyIdForUser(userId);
    return this.adminFindOne(agencyId);
  }

  async updateMyAgency(
    userId: string,
    dto: AgencyAdminUpdateAgencyDto,
  ): Promise<AgencyResponseDto> {
    const agencyId = await this.getAgencyIdForUser(userId);

    if (dto.email) {
      const existing = await this.prisma.agency.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== agencyId) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    return this.prisma.agency.update({
      where: { id: agencyId },
      data: dto,
    });
  }

  async getMyAgents(
    userId: string,
    query: PaginationDto,
  ): Promise<PaginatedResult<AgencyAgentItemDto>> {
    const agencyId = await this.getAgencyIdForUser(userId);
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AgentWhereInput = {
      agencyId,
      user: { deletedAt: null },
    };

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: agents.map((agent) => ({
        ...agent,
        user: omitPassword(agent.user),
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

  async addAgent(
    userId: string,
    dto: CreateAgencyAgentDto,
  ): Promise<AgencyAgentItemDto> {
    const agencyId = await this.getAgencyIdForUser(userId);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException(
        'Un compte utilisateur avec cet email existe déjà',
      );
    }

    const hashedPassword = await this.tokenService.hashPassword(dto.password);

    const agent = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          gender: dto.gender,
          role: Role.AGENT,
          isActive: true,
          isVerified: true,
          emailVerified: true,
          status: 'ACTIVE',
        },
      });

      const createdAgent = await tx.agent.create({
        data: {
          userId: createdUser.id,
          agencyId,
          title: dto.title,
          licenseNumber: dto.licenseNumber,
          biography: dto.biography,
          specialties: dto.specialties ?? [],
          yearsExperience: dto.yearsExperience,
          isAvailable: true,
        },
        include: {
          user: true,
        },
      });

      return createdAgent;
    });

    return {
      ...agent,
      user: omitPassword(agent.user),
    };
  }

  async updateAgent(
    userId: string,
    agentId: string,
    dto: UpdateAgencyAgentDto,
  ): Promise<AgencyAgentItemDto> {
    const agencyId = await this.getAgencyIdForUser(userId);

    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent || agent.agencyId !== agencyId) {
      throw new NotFoundException('Agent non trouvé dans votre agence');
    }

    const updated = await this.prisma.agent.update({
      where: { id: agentId },
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
      },
    });

    return {
      ...updated,
      user: omitPassword(updated.user),
    };
  }

  async removeAgent(
    userId: string,
    agentId: string,
  ): Promise<{ message: string }> {
    const agencyId = await this.getAgencyIdForUser(userId);

    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent || agent.agencyId !== agencyId) {
      throw new NotFoundException('Agent non trouvé dans votre agence');
    }

    // Désactiver le compte utilisateur de l'agent et révoquer ses tokens
    await this.prisma.user.update({
      where: { id: agent.userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await this.tokenService.revokeAllRefreshTokens(agent.userId);

    return { message: "L'agent a été retiré et son compte a été désactivé." };
  }
}
