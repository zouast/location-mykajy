import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { VisitStatus, NotificationType, Role } from '@prisma/client';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  private activeStatuses = [VisitStatus.PENDING, VisitStatus.CONFIRMED];

  /**
   * Create a visit request — prevents obvious conflicts for the same listing or agent
   */
  async create(userId: string | null, dto: CreateVisitDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { property: { include: { agent: true, owner: true } }, price: true },
    });

    if (!listing) throw new NotFoundException('Annonce introuvable');

    const start = new Date(dto.scheduledAt);
    if (isNaN(start.getTime())) throw new BadRequestException('Date invalide');
    const duration = dto.duration ?? 30;
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const assignedAgentId = dto.agentId || listing.property.agentId || undefined;

    // Search candidate visits in a reasonable window and then check overlaps in JS
    const windowStart = new Date(start.getTime() - 1000 * 60 * 60 * 24); // 24h before

    const candidates = await this.prisma.visit.findMany({
      where: {
        AND: [
          { status: { in: this.activeStatuses } },
          {
            OR: [
              { listingId: dto.listingId },
              ...(assignedAgentId ? [{ agentId: assignedAgentId }] : []),
            ],
          },
          { scheduledAt: { lt: end } },
          { scheduledAt: { gte: windowStart } },
        ],
      },
    });

    for (const v of candidates) {
      const vStart = new Date(v.scheduledAt);
      const vDuration = v.duration ?? 30;
      const vEnd = new Date(vStart.getTime() + vDuration * 60 * 1000);

      const overlap = vStart < end && vEnd > start;
      if (overlap) {
        // If overlap concerns same agent or same listing — conflict
        if (v.listingId === dto.listingId || (assignedAgentId && v.agentId === assignedAgentId)) {
          throw new ConflictException('Conflit de planning détecté pour cette période');
        }
      }
    }

    const visit = await this.prisma.visit.create({
      data: {
        listingId: dto.listingId,
        clientId: userId || undefined,
        agentId: assignedAgentId,
        scheduledAt: start,
        duration,
        type: dto.type,
        clientNotes: dto.clientNotes,
        status: VisitStatus.PENDING,
      },
      include: {
        client: true,
        listing: { include: { property: { include: { location: true, media: { where: { isPrimary: true }, take: 1 } }, }, price: true } },
        agent: true,
      },
    });

    // Notify the responsible user (agent or owner)
    const targetUserId = listing.property.agent?.userId || listing.property.owner?.userId;
    if (targetUserId) {
      await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          type: NotificationType.VISIT_REQUEST,
          title: 'Nouvelle demande de visite',
          content: `Nouvelle demande de visite pour l'annonce ${listing.title || listing.property.title}`,
          metadata: { visitId: visit.id, listingId: listing.id },
        },
      });
    }

    return visit;
  }

  async findMySentVisits(userId: string) {
    return this.prisma.visit.findMany({
      where: { clientId: userId },
      orderBy: { scheduledAt: 'desc' },
      include: { listing: { include: { property: { include: { location: true, media: { where: { isPrimary: true }, take: 1 } } }, price: true } }, agent: true },
    });
  }

  async findPublic(listingId: string) {
    return this.prisma.visit.findMany({
      where: { listingId },
      orderBy: { scheduledAt: 'desc' },
      select: { id: true, scheduledAt: true, duration: true, status: true, agentId: true },
    });
  }

  async findReceivedVisits(userId: string, role: Role, status?: VisitStatus | string) {
    // Build where according to role
    let where: any = {};

    if (role === Role.ADMIN) {
      where = { ...(status ? { status } : {}) };
    } else if (role === Role.AGENT) {
      const agent = await this.prisma.agent.findUnique({ where: { userId } });
      if (!agent) return [];
      where = { agentId: agent.id, ...(status ? { status } : {}) };
    } else if (role === Role.OWNER) {
      const owner = await this.prisma.owner.findUnique({ where: { userId } });
      if (!owner) return [];
      where = {
        listing: {
          property: {
            ownerId: owner.id,
          },
        },
        ...(status ? { status } : {}),
      };
    } else {
      // default empty
      return [];
    }

    return this.prisma.visit.findMany({ where, orderBy: { scheduledAt: 'desc' }, include: { listing: true, client: true, agent: true } });
  }

  async find(filter: { clientId?: string; agentId?: string; listingId?: string }) {
    const where: any = {};
    if (filter.clientId) where.clientId = filter.clientId;
    if (filter.agentId) where.agentId = filter.agentId;
    if (filter.listingId) where.listingId = filter.listingId;

    return this.prisma.visit.findMany({ where, orderBy: { scheduledAt: 'desc' }, include: { listing: true, client: true, agent: true } });
  }

  async updateStatus(id: string, user: { id: string; role: Role } | null, dto: UpdateVisitStatusDto) {
    const visit = await this.prisma.visit.findUnique({ where: { id }, include: { listing: { include: { property: true } }, agent: true } });
    if (!visit) throw new NotFoundException('Visite introuvable');

    // Permission matrix:
    // - Client can cancel their own visit => set CANCELLED_BY_CLIENT
    // - Agent (assigned) can confirm, cancel by agent, complete
    // - Owner of property can cancel by agent / confirm
    // - Admin can do anything

    const requestedStatus = dto.status ?? visit.status;

    // If user is null or undefined, deny
    if (!user) throw new ForbiddenException('Authentication required');

    const isClientOwner = visit.clientId === user.id && user.role === Role.CLIENT;

    const isAssignedAgent = visit.agentId && visit.agent && visit.agent.userId === user.id && user.role === Role.AGENT;

    const isOwner = visit.listing?.property?.ownerId
      ? (await this.prisma.owner.findUnique({ where: { id: visit.listing.property.ownerId } }))?.userId === user.id && user.role === Role.OWNER
      : false;

    const isAdmin = user.role === Role.ADMIN;

    // Client-only actions
    if (user.role === Role.CLIENT) {
      if (!isClientOwner) throw new ForbiddenException('Can only modify your own visits');
      if (requestedStatus !== VisitStatus.CANCELLED_BY_CLIENT) {
        throw new ForbiddenException('Clients can only cancel their visits');
      }
    }

    // Agent/Owner actions: allow confirm, cancel by agent, complete
    if (user.role === Role.AGENT || user.role === Role.OWNER) {
      if (!(isAssignedAgent || isOwner || isAdmin)) {
        throw new ForbiddenException('Not allowed to modify this visit');
      }
      const allowed = [VisitStatus.CONFIRMED, VisitStatus.CANCELLED_BY_AGENT, VisitStatus.COMPLETED, VisitStatus.NO_SHOW];
      if (!allowed.includes(requestedStatus as VisitStatus) && !isAdmin) {
        throw new ForbiddenException('Not allowed to set this status');
      }
    }

    // Admin can do anything; if reached here and role not matched, deny
    if (![Role.ADMIN, Role.AGENT, Role.OWNER, Role.CLIENT].includes(user.role)) {
      throw new ForbiddenException('Not allowed');
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data: { status: requestedStatus, agentNotes: dto.reason ?? visit.agentNotes, cancelReason: dto.reason ?? visit.cancelReason },
      include: { client: true, listing: true, agent: true },
    });

    // Notify client when status changes
    if (updated.clientId) {
      await this.prisma.notification.create({
        data: {
          userId: updated.clientId,
          type: requestedStatus === VisitStatus.CONFIRMED ? NotificationType.VISIT_CONFIRMED : NotificationType.VISIT_CANCELLED,
          title: requestedStatus === VisitStatus.CONFIRMED ? 'Visite confirmée' : 'Visite annulée',
          content: `La visite pour l'annonce ${updated.listingId} a été mise à jour: ${requestedStatus}`,
          metadata: { visitId: updated.id, listingId: updated.listingId },
        },
      });
    }

    return updated;
  }
}
