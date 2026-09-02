import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Property, PropertyStatus, Role } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import {
  PaginatedPropertiesResponseDto,
  PropertyResponseDto,
} from './dto/property-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

const ALLOWED_PROPERTY_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'area',
  'landArea',
  'rooms',
  'bedrooms',
  'yearBuilt',
  'title',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Résolution dynamique du type de bien ──────────────────────────────────

  async resolvePropertyType(typeInput: string): Promise<string> {
    const slug = slugify(typeInput);

    // Recherche par slug ou id ou nom
    let propertyType = await this.prisma.propertyType.findFirst({
      where: {
        OR: [
          { id: typeInput },
          { slug },
          { name: { equals: typeInput, mode: 'insensitive' } },
        ],
      },
    });

    if (!propertyType) {
      // Auto-création si non existant
      const formattedName =
        typeInput.charAt(0).toUpperCase() + typeInput.slice(1);
      propertyType = await this.prisma.propertyType.create({
        data: {
          name: formattedName,
          slug,
          description: `Type de bien : ${formattedName}`,
        },
      });
    }

    return propertyType.id;
  }

  // ── Contrôle des autorisations ────────────────────────────────────────────

  private async checkUserPropertyPermission(
    user: AuthenticatedUser,
    property: Property,
    action: 'READ' | 'UPDATE' | 'DELETE',
  ): Promise<void> {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (action === 'READ' && property.status === PropertyStatus.AVAILABLE) {
      return;
    }

    if (user.role === Role.OWNER) {
      const owner = await this.prisma.owner.findUnique({
        where: { userId: user.id },
      });
      if (owner && property.ownerId === owner.id) {
        return;
      }
    }

    if (user.role === Role.AGENT || user.role === Role.AGENCY_ADMIN) {
      const agent = await this.prisma.agent.findUnique({
        where: { userId: user.id },
      });
      if (agent) {
        if (property.agentId === agent.id) {
          return;
        }
        if (agent.agencyId && property.agencyId === agent.agencyId) {
          return;
        }
      }
    }

    throw new ForbiddenException(
      "Vous n'avez pas les droits nécessaires sur ce bien immobilier",
    );
  }

  // ── CRUD Biens Immobiliers ────────────────────────────────────────────────

  async create(
    user: AuthenticatedUser,
    dto: CreatePropertyDto,
  ): Promise<PropertyResponseDto> {
    const typeId = await this.resolvePropertyType(dto.type);

    let ownerId = dto.ownerId;
    let agencyId = dto.agencyId;
    let agentId = dto.agentId;

    if (user.role === Role.OWNER) {
      let owner = await this.prisma.owner.findUnique({
        where: { userId: user.id },
      });
      if (!owner) {
        owner = await this.prisma.owner.create({
          data: { userId: user.id },
        });
      }
      ownerId = owner.id;
    } else if (user.role === Role.AGENT) {
      const agent = await this.prisma.agent.findUnique({
        where: { userId: user.id },
      });
      if (agent) {
        agentId = agent.id;
        agencyId = agent.agencyId;
      }
    } else if (user.role === Role.AGENCY_ADMIN) {
      const agent = await this.prisma.agent.findUnique({
        where: { userId: user.id },
      });
      if (agent) {
        agencyId = agent.agencyId;
        agentId = dto.agentId ?? agent.id;
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const location = await tx.location.create({
        data: {
          address: dto.location.address,
          complement: dto.location.complement,
          city: dto.location.city,
          state: dto.location.state,
          zipCode: dto.location.zipCode,
          country: dto.location.country ?? 'France',
          latitude: dto.location.latitude,
          longitude: dto.location.longitude,
          neighborhood: dto.location.neighborhood,
        },
      });

      const property = await tx.property.create({
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status ?? PropertyStatus.AVAILABLE,
          area: dto.area,
          landArea: dto.landArea,
          rooms: dto.rooms,
          bedrooms: dto.bedrooms,
          bathrooms: dto.bathrooms,
          yearBuilt: dto.yearBuilt,
          floor: dto.floor,
          totalFloors: dto.totalFloors,
          parkingSpaces: dto.parkingSpaces,
          energyRating: dto.energyRating,
          ghgRating: dto.ghgRating,
          isFurnished: dto.isFurnished ?? false,
          hasElevator: dto.hasElevator ?? false,
          hasBalcony: dto.hasBalcony ?? false,
          hasGarden: dto.hasGarden ?? false,
          hasPool: dto.hasPool ?? false,
          hasGarage: dto.hasGarage ?? false,
          typeId,
          locationId: location.id,
          ownerId,
          agencyId,
          agentId,
          ...(dto.features?.length && {
            features: {
              create: dto.features.map((f) => ({
                name: f.name,
                category: f.category,
                value: f.value,
              })),
            },
          }),
        },
        include: {
          type: true,
          location: true,
          features: true,
          media: true,
        },
      });

      return property;
    });

    return created;
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdatePropertyDto,
  ): Promise<PropertyResponseDto> {
    const existing = await this.prisma.property.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Bien immobilier non trouvé');
    }

    await this.checkUserPropertyPermission(user, existing, 'UPDATE');

    let typeId = existing.typeId;
    if (dto.type) {
      typeId = await this.resolvePropertyType(dto.type);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.location) {
        await tx.location.update({
          where: { id: existing.locationId },
          data: {
            address: dto.location.address,
            complement: dto.location.complement,
            city: dto.location.city,
            state: dto.location.state,
            zipCode: dto.location.zipCode,
            country: dto.location.country,
            latitude: dto.location.latitude,
            longitude: dto.location.longitude,
            neighborhood: dto.location.neighborhood,
          },
        });
      }

      if (dto.features) {
        await tx.propertyFeature.deleteMany({
          where: { propertyId: id },
        });
        if (dto.features.length) {
          await tx.propertyFeature.createMany({
            data: dto.features.map((f) => ({
              propertyId: id,
              name: f.name,
              category: f.category,
              value: f.value,
            })),
          });
        }
      }

      const property = await tx.property.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.area !== undefined && { area: dto.area }),
          ...(dto.landArea !== undefined && { landArea: dto.landArea }),
          ...(dto.rooms !== undefined && { rooms: dto.rooms }),
          ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
          ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
          ...(dto.yearBuilt !== undefined && { yearBuilt: dto.yearBuilt }),
          ...(dto.floor !== undefined && { floor: dto.floor }),
          ...(dto.totalFloors !== undefined && {
            totalFloors: dto.totalFloors,
          }),
          ...(dto.parkingSpaces !== undefined && {
            parkingSpaces: dto.parkingSpaces,
          }),
          ...(dto.energyRating !== undefined && {
            energyRating: dto.energyRating,
          }),
          ...(dto.ghgRating !== undefined && { ghgRating: dto.ghgRating }),
          ...(dto.isFurnished !== undefined && {
            isFurnished: dto.isFurnished,
          }),
          ...(dto.hasElevator !== undefined && {
            hasElevator: dto.hasElevator,
          }),
          ...(dto.hasBalcony !== undefined && { hasBalcony: dto.hasBalcony }),
          ...(dto.hasGarden !== undefined && { hasGarden: dto.hasGarden }),
          ...(dto.hasPool !== undefined && { hasPool: dto.hasPool }),
          ...(dto.hasGarage !== undefined && { hasGarage: dto.hasGarage }),
          typeId,
          ...(user.role === Role.ADMIN && {
            ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
            ...(dto.agencyId !== undefined && { agencyId: dto.agencyId }),
            ...(dto.agentId !== undefined && { agentId: dto.agentId }),
          }),
        },
        include: {
          type: true,
          location: true,
          features: true,
          media: true,
        },
      });

      return property;
    });

    return updated;
  }

  async findOne(
    id: string,
    user?: AuthenticatedUser,
  ): Promise<PropertyResponseDto> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        type: true,
        location: true,
        features: true,
        media: true,
      },
    });

    if (!property || property.deletedAt) {
      throw new NotFoundException('Bien immobilier non trouvé');
    }

    if (user) {
      await this.checkUserPropertyPermission(user, property, 'READ');
    } else if (property.status !== PropertyStatus.AVAILABLE) {
      throw new NotFoundException('Bien immobilier indisponible');
    }

    return property;
  }

  async findAll(
    filter: PropertyFilterDto,
    user?: AuthenticatedUser,
  ): Promise<PaginatedResult<PropertyResponseDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      city,
      zipCode,
      minArea,
      maxArea,
      minLandArea,
      minRooms,
      minBedrooms,
      minBathrooms,
      isFurnished,
      hasElevator,
      hasBalcony,
      hasGarden,
      hasPool,
      hasGarage,
      energyRating,
      ownerId,
      agencyId,
      agentId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    const validatedSortBy = ALLOWED_PROPERTY_SORT_FIELDS.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      ...(status
        ? { status }
        : !user || user.role === Role.CLIENT
          ? { status: PropertyStatus.AVAILABLE }
          : {}),
      ...(type && {
        type: {
          OR: [
            { slug: slugify(type) },
            { name: { contains: type, mode: 'insensitive' } },
          ],
        },
      }),
      ...(ownerId && { ownerId }),
      ...(agencyId && { agencyId }),
      ...(agentId && { agentId }),
      ...(isFurnished !== undefined && { isFurnished }),
      ...(hasElevator !== undefined && { hasElevator }),
      ...(hasBalcony !== undefined && { hasBalcony }),
      ...(hasGarden !== undefined && { hasGarden }),
      ...(hasPool !== undefined && { hasPool }),
      ...(hasGarage !== undefined && { hasGarage }),
      ...(energyRating && {
        energyRating: { equals: energyRating, mode: 'insensitive' },
      }),
      ...(minArea !== undefined || maxArea !== undefined
        ? {
            area: {
              ...(minArea !== undefined && { gte: minArea }),
              ...(maxArea !== undefined && { lte: maxArea }),
            },
          }
        : {}),
      ...(minLandArea !== undefined && { landArea: { gte: minLandArea } }),
      ...(minRooms !== undefined && { rooms: { gte: minRooms } }),
      ...(minBedrooms !== undefined && { bedrooms: { gte: minBedrooms } }),
      ...(minBathrooms !== undefined && { bathrooms: { gte: minBathrooms } }),
      ...(city || zipCode
        ? {
            location: {
              ...(city && { city: { contains: city, mode: 'insensitive' } }),
              ...(zipCode && { zipCode: { startsWith: zipCode } }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { city: { contains: search, mode: 'insensitive' } } },
          { location: { zipCode: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        include: {
          type: true,
          location: true,
          features: true,
          media: true,
        },
        orderBy: { [validatedSortBy]: sortOrder },
      }),
      this.prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: properties as unknown as PropertyResponseDto[],
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

  async getMyProperties(
    user: AuthenticatedUser,
    filter: PropertyFilterDto,
  ): Promise<PaginatedResult<PropertyResponseDto>> {
    const specificFilter = { ...filter };

    if (user.role === Role.OWNER) {
      const owner = await this.prisma.owner.findUnique({
        where: { userId: user.id },
      });
      if (!owner) {
        return {
          items: [],
          meta: {
            page: 1,
            limit: filter.limit || 10,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
      specificFilter.ownerId = owner.id;
    } else if (user.role === Role.AGENT) {
      const agent = await this.prisma.agent.findUnique({
        where: { userId: user.id },
      });
      if (!agent) {
        return {
          items: [],
          meta: {
            page: 1,
            limit: filter.limit || 10,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
      specificFilter.agentId = agent.id;
    } else if (user.role === Role.AGENCY_ADMIN) {
      const agent = await this.prisma.agent.findUnique({
        where: { userId: user.id },
      });
      if (agent?.agencyId) {
        specificFilter.agencyId = agent.agencyId;
      }
    }

    return this.findAll(
      Object.assign(new PropertyFilterDto(), specificFilter),
      user,
    );
  }

  async remove(
    user: AuthenticatedUser,
    id: string,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Bien immobilier non trouvé');
    }

    await this.checkUserPropertyPermission(user, existing, 'DELETE');

    await this.prisma.property.update({
      where: { id },
      data: {
        status: PropertyStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });

    return { message: 'Bien immobilier désactivé et archivé avec succès' };
  }
}
