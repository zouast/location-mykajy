import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import {
  VisitResponseDto,
  AvailabilityResponseDto,
  DayAvailabilitySlotDto,
} from './dto/visit-response.dto';
import { VisitStatus, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Créer une demande de visite avec détection et blocage des conflits
   */
  async create(clientId: string, dto: CreateVisitDto): Promise<VisitResponseDto> {
    const scheduledStart = new Date(dto.scheduledAt);
    if (isNaN(scheduledStart.getTime())) {
      throw new BadRequestException('Date et heure de visite invalides.');
    }

    // Interdire la réservation dans le passé
    if (scheduledStart.getTime() < Date.now()) {
      throw new BadRequestException('La date de visite doit être située dans le futur.');
    }

    const duration = dto.duration || 45;
    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60 * 1000);

    // Récupérer l'annonce et l'agent assigné
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: {
        property: {
          include: {
            agent: true,
            owner: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`L'annonce avec l'ID ${dto.listingId} n'existe pas.`);
    }

    const agentId = listing.property.agentId || undefined;

    // ── VÉRIFICATION DES CONFLITS HORAIRES SUR LE BIEN ET L'AGENT ──
    await this.assertNoSchedulingConflict(dto.listingId, agentId, scheduledStart, duration);

    // Création de la visite
    const visit = await this.prisma.visit.create({
      data: {
        listingId: dto.listingId,
        clientId,
        agentId,
        scheduledAt: scheduledStart,
        duration,
        type: dto.type || 'IN_PERSON',
        status: VisitStatus.REQUESTED,
        clientNotes: dto.clientNotes,
      },
      include: {
        client: true,
        agent: {
          include: {
            user: true,
          },
        },
        listing: {
          include: {
            price: true,
            property: {
              include: {
                location: true,
                media: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    // Notification multi-canaux à l'agent ou propriétaire
    const targetUserId =
      listing.property.agent?.userId || listing.property.owner?.userId;

    if (targetUserId) {
      const clientName = [visit.client.firstName, visit.client.lastName]
        .filter(Boolean)
        .join(' ') || visit.client.email;

      await this.notificationsService.notifyVisitRequested({
        recipientUserId: targetUserId,
        listingTitle: listing.title || listing.property.title,
        clientName,
        visitDate: scheduledStart,
        visitId: visit.id,
      });
    }

    return this.mapToDto(visit);
  }

  /**
   * Calculer les disponibilités journalières pour une annonce (créneaux libres / occupés)
   */
  async getAvailability(listingId: string, dateStr: string): Promise<AvailabilityResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { property: true },
    });

    if (!listing) {
      throw new NotFoundException(`Annonce ${listingId} introuvable.`);
    }

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    // Récupérer les visites existantes pour cette journée sur cette annonce
    const activeVisits = await this.prisma.visit.findMany({
      where: {
        listingId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [VisitStatus.REQUESTED, VisitStatus.CONFIRMED],
        },
      },
      select: {
        scheduledAt: true,
        duration: true,
      },
    });

    // Plage d'horaires standards de visite (9h00 à 18h00)
    const standardHours = [
      '09:00',
      '10:00',
      '11:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
    ];

    const now = Date.now();

    const slots: DayAvailabilitySlotDto[] = standardHours.map((hourStr) => {
      const slotDate = new Date(`${dateStr}T${hourStr}:00.000Z`);
      const slotStartTime = slotDate.getTime();
      const slotEndTime = slotStartTime + 45 * 60 * 1000;

      // Est-ce dans le passé ?
      if (slotStartTime < now) {
        return {
          time: hourStr,
          isAvailable: false,
          reason: 'Créneau passé',
        };
      }

      // Conflit avec une visite existante ?
      const conflict = activeVisits.some((v) => {
        const vStart = new Date(v.scheduledAt).getTime();
        const vEnd = vStart + (v.duration || 45) * 60 * 1000;
        return slotStartTime < vEnd && slotEndTime > vStart;
      });

      if (conflict) {
        return {
          time: hourStr,
          isAvailable: false,
          reason: 'Créneau déjà réservé',
        };
      }

      return {
        time: hourStr,
        isAvailable: true,
      };
    });

    return {
      date: dateStr,
      slots,
    };
  }

  /**
   * Mettre à jour le statut d'une visite (Confirmation, Annulation, Rejet, Clôture)
   */
  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateVisitStatusDto,
  ): Promise<VisitResponseDto> {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
        client: true,
        agent: { include: { user: true } },
        listing: {
          include: {
            property: {
              include: {
                agent: true,
                owner: true,
              },
            },
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visite avec l'ID ${id} non trouvée.`);
    }

    const isClient = visit.clientId === userId;
    const isAgent = visit.agent?.userId === userId || visit.listing.property.agent?.userId === userId;
    const isOwner = visit.listing.property.owner?.userId === userId;

    if (!isClient && !isAgent && !isOwner) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== Role.ADMIN) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette visite.");
      }
    }

    // Si on confirme, vérifier à nouveau l'absence de conflit
    if (dto.status === VisitStatus.CONFIRMED && visit.status !== VisitStatus.CONFIRMED) {
      await this.assertNoSchedulingConflict(
        visit.listingId,
        visit.agentId || undefined,
        visit.scheduledAt,
        visit.duration || 45,
        visit.id,
      );
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.agentNotes !== undefined && { agentNotes: dto.agentNotes }),
        ...(dto.cancelReason !== undefined && { cancelReason: dto.cancelReason }),
      },
      include: {
        client: true,
        agent: { include: { user: true } },
        listing: {
          include: {
            price: true,
            property: {
              include: {
                location: true,
                media: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    // ── NOTIFICATIONS MULTI-CANAUX SELON L'ACTION ──
    const listingTitle = updated.listing.title || updated.listing.property.title;

    if (dto.status === VisitStatus.CONFIRMED && visit.clientId) {
      // Notifier le client de la confirmation
      await this.notificationsService.notifyVisitConfirmed({
        recipientUserId: visit.clientId,
        listingTitle,
        visitDate: updated.scheduledAt,
        visitId: updated.id,
      });
    } else if (dto.status === VisitStatus.CANCELLED || dto.status === VisitStatus.REJECTED) {
      // Notifier l'autre partie
      const targetUserId = isClient
        ? updated.listing.property.agent?.userId || updated.listing.property.owner?.userId
        : visit.clientId;

      if (targetUserId) {
        await this.notificationsService.notifyVisitCancelled({
          recipientUserId: targetUserId,
          listingTitle,
          reason: dto.cancelReason,
          visitId: updated.id,
        });
      }
    }

    return this.mapToDto(updated);
  }

  /**
   * Lister les visites du client connecté
   */
  async getMyClientVisits(
    clientId: string,
    page = 1,
    limit = 12,
    status?: VisitStatus,
  ): Promise<{ items: VisitResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [visits, total] = await Promise.all([
      this.prisma.visit.findMany({
        where: {
          clientId,
          ...(status && { status }),
        },
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          client: true,
          agent: { include: { user: true } },
          listing: {
            include: {
              price: true,
              property: {
                include: {
                  location: true,
                  media: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
      }),
      this.prisma.visit.count({
        where: {
          clientId,
          ...(status && { status }),
        },
      }),
    ]);

    return {
      items: visits.map((v) => this.mapToDto(v)),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Agenda & planning pour l'agent ou le propriétaire
   */
  async getAgendaVisits(
    userId: string,
    role: Role,
    status?: VisitStatus,
    fromDate?: string,
    toDate?: string,
    page = 1,
    limit = 50,
  ): Promise<{ items: VisitResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;

    let whereClause: Record<string, unknown> = {};

    if (role === Role.ADMIN) {
      whereClause = {};
    } else if (role === Role.AGENT) {
      const agent = await this.prisma.agent.findUnique({ where: { userId } });
      if (!agent) return { items: [], total: 0 };
      whereClause = { agentId: agent.id };
    } else if (role === Role.OWNER) {
      const owner = await this.prisma.owner.findUnique({ where: { userId } });
      if (!owner) return { items: [], total: 0 };
      whereClause = {
        listing: {
          property: {
            ownerId: owner.id,
          },
        },
      };
    } else {
      whereClause = {
        OR: [
          { listing: { property: { owner: { userId } } } },
          { agent: { userId } },
        ],
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (fromDate || toDate) {
      whereClause.scheduledAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    const [visits, total] = await Promise.all([
      this.prisma.visit.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          client: true,
          agent: { include: { user: true } },
          listing: {
            include: {
              price: true,
              property: {
                include: {
                  location: true,
                  media: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
      }),
      this.prisma.visit.count({ where: whereClause }),
    ]);

    return {
      items: visits.map((v) => this.mapToDto(v)),
      total,
    };
  }

  /**
   * Consulter le détail d'une visite
   */
  async findOne(userId: string, id: string): Promise<VisitResponseDto> {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
        client: true,
        agent: { include: { user: true } },
        listing: {
          include: {
            price: true,
            property: {
              include: {
                agent: true,
                owner: true,
                location: true,
                media: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visite avec l'ID ${id} non trouvée.`);
    }

    return this.mapToDto(visit);
  }

  /**
   * Supprimer une visite
   */
  async remove(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(userId, id);
    await this.prisma.visit.delete({ where: { id } });
    return { success: true, message: 'Visite supprimée avec succès.' };
  }

  /**
   * Helper : Vérification stricte des conflits de réservation
   */
  private async assertNoSchedulingConflict(
    listingId: string,
    agentId: string | undefined,
    startTime: Date,
    durationMinutes: number,
    excludeVisitId?: string,
  ): Promise<void> {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // 1. Conflit sur l'annonce même
    const conflictingPropertyVisits = await this.prisma.visit.findMany({
      where: {
        listingId,
        ...(excludeVisitId && { id: { not: excludeVisitId } }),
        status: { in: [VisitStatus.REQUESTED, VisitStatus.CONFIRMED] },
        scheduledAt: {
          lt: endTime,
        },
      },
      select: {
        id: true,
        scheduledAt: true,
        duration: true,
      },
    });

    const hasListingConflict = conflictingPropertyVisits.some((v) => {
      const vStart = new Date(v.scheduledAt).getTime();
      const vEnd = vStart + (v.duration || 45) * 60 * 1000;
      return startTime.getTime() < vEnd && endTime.getTime() > vStart;
    });

    if (hasListingConflict) {
      throw new ConflictException(
        'Ce bien fait déjà l’objet d’une visite programmée sur ce créneau horaire.',
      );
    }

    // 2. Conflit sur l'agenda de l'agent
    if (agentId) {
      const conflictingAgentVisits = await this.prisma.visit.findMany({
        where: {
          agentId,
          ...(excludeVisitId && { id: { not: excludeVisitId } }),
          status: { in: [VisitStatus.CONFIRMED] },
          scheduledAt: {
            lt: endTime,
          },
        },
        select: {
          id: true,
          scheduledAt: true,
          duration: true,
        },
      });

      const hasAgentConflict = conflictingAgentVisits.some((v) => {
        const vStart = new Date(v.scheduledAt).getTime();
        const vEnd = vStart + (v.duration || 45) * 60 * 1000;
        return startTime.getTime() < vEnd && endTime.getTime() > vStart;
      });

      if (hasAgentConflict) {
        throw new ConflictException(
          'Le conseiller immobilier est déjà engagé sur un autre rendez-vous à cet horaire.',
        );
      }
    }
  }

  /**
   * Helper DTO mapping
   */
  private mapToDto(v: {
    id: string;
    listingId: string;
    clientId: string;
    agentId: string | null;
    scheduledAt: Date;
    duration: number | null;
    type: string;
    status: VisitStatus;
    clientNotes: string | null;
    agentNotes: string | null;
    cancelReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    client?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
    } | null;
    agent?: {
      id: string;
      user?: {
        firstName: string | null;
        lastName: string | null;
        email: string;
        phone: string | null;
      };
    } | null;
    listing?: {
      id: string;
      title: string | null;
      transactionType: string;
      price?: { price: number } | null;
      property: {
        title: string;
        location: { city: string };
        media: Array<{ url: string }>;
      };
    } | null;
  }): VisitResponseDto {
    const agentName = v.agent?.user
      ? [v.agent.user.firstName, v.agent.user.lastName].filter(Boolean).join(' ')
      : undefined;

    return {
      id: v.id,
      listingId: v.listingId,
      clientId: v.clientId,
      agentId: v.agentId,
      scheduledAt: v.scheduledAt,
      duration: v.duration || 45,
      type: v.type as unknown as VisitResponseDto['type'],
      status: v.status,
      clientNotes: v.clientNotes,
      agentNotes: v.agentNotes,
      cancelReason: v.cancelReason,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      client: v.client
        ? {
            id: v.client.id,
            email: v.client.email,
            firstName: v.client.firstName,
            lastName: v.client.lastName,
            phone: v.client.phone,
          }
        : null,
      agent: v.agent
        ? {
            id: v.agent.id,
            name: agentName || 'Conseiller',
            email: v.agent.user?.email,
            phone: v.agent.user?.phone || undefined,
          }
        : null,
      listing: v.listing
        ? {
            id: v.listing.id,
            title: v.listing.title || v.listing.property.title,
            transactionType: v.listing.transactionType,
            city: v.listing.property.location.city,
            primaryPhotoUrl: v.listing.property.media[0]?.url,
            price: v.listing.price?.price,
          }
        : null,
    };
  }
}
