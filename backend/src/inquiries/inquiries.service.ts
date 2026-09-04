import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { InquiryResponseDto } from './dto/inquiry-response.dto';
import { InquiryStatus, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Créer une nouvelle demande de contact / information sur un bien
   */
  async create(userId: string | null, dto: CreateInquiryDto): Promise<InquiryResponseDto> {
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

    // Récupérer les informations de l'utilisateur connecté si non spécifiées
    let clientName = dto.name;
    let clientEmail = dto.email;
    let clientPhone = dto.phone;

    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        if (!clientName && (user.firstName || user.lastName)) {
          clientName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        }
        if (!clientEmail) {
          clientEmail = user.email;
        }
        if (!clientPhone && user.phone) {
          clientPhone = user.phone;
        }
      }
    }

    const targetAgentId = listing.property.agentId || undefined;

    // Création de la demande
    const inquiry = await this.prisma.inquiry.create({
      data: {
        listingId: dto.listingId,
        clientId: userId || undefined,
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        agentId: targetAgentId,
        subject: dto.subject,
        message: dto.message,
        status: InquiryStatus.NEW,
      },
      include: {
        client: true,
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

    // Déclencher une notification multi-canaux pour le destinataire
    const targetUserId =
      listing.property.agent?.userId || listing.property.owner?.userId;

    if (targetUserId) {
      await this.notificationsService.notifyNewInquiry({
        recipientUserId: targetUserId,
        listingTitle: listing.title || listing.property.title,
        senderName: clientName || clientEmail || 'Un visiteur',
        inquiryId: inquiry.id,
        messagePreview: dto.message?.slice(0, 100),
      });
    }

    return this.mapToDto(inquiry);
  }

  /**
   * Consulter les demandes envoyées par l'utilisateur connecté (Client)
   */
  async findMySentInquiries(
    userId: string,
    page = 1,
    limit = 12,
  ): Promise<{ items: InquiryResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where: { clientId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
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
      this.prisma.inquiry.count({ where: { clientId: userId } }),
    ]);

    return {
      items: inquiries.map((inq) => this.mapToDto(inq)),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Consulter les demandes reçues par l'agent ou le propriétaire (Espace de gestion)
   */
  async findReceivedInquiries(
    userId: string,
    role: Role,
    status?: InquiryStatus,
    page = 1,
    limit = 12,
  ): Promise<{ items: InquiryResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    // Définir la condition selon le rôle
    let whereCondition: object = {};

    if (role === Role.ADMIN) {
      whereCondition = status ? { status } : {};
    } else if (role === Role.AGENT) {
      const agentProfile = await this.prisma.agent.findUnique({ where: { userId } });
      if (!agentProfile) {
        return { items: [], total: 0, page, totalPages: 1 };
      }
      whereCondition = {
        agentId: agentProfile.id,
        ...(status && { status }),
      };
    } else if (role === Role.OWNER) {
      const ownerProfile = await this.prisma.owner.findUnique({ where: { userId } });
      if (!ownerProfile) {
        return { items: [], total: 0, page, totalPages: 1 };
      }
      whereCondition = {
        listing: {
          property: {
            ownerId: ownerProfile.id,
          },
        },
        ...(status && { status }),
      };
    } else {
      // Pour les clients ou utilisateurs par défaut
      whereCondition = {
        OR: [
          { listing: { property: { owner: { userId } } } },
          { agent: { userId } },
        ],
        ...(status && { status }),
      };
    }

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
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
      this.prisma.inquiry.count({ where: whereCondition }),
    ]);

    return {
      items: inquiries.map((inq) => this.mapToDto(inq)),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Consulter une demande spécifique
   */
  async findOne(userId: string, id: string): Promise<InquiryResponseDto> {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        client: true,
        agent: true,
        listing: {
          include: {
            price: true,
            property: {
              include: {
                owner: true,
                agent: true,
                location: true,
                media: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException(`Demande avec l'ID ${id} non trouvée.`);
    }

    // Vérifier l'autorisation (expéditeur, agent ou propriétaire)
    const isSender = inquiry.clientId === userId;
    const isAgent = inquiry.agent?.userId === userId || inquiry.listing.property.agent?.userId === userId;
    const isOwner = inquiry.listing.property.owner?.userId === userId;

    if (!isSender && !isAgent && !isOwner) {
      // Vérifier si admin
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== Role.ADMIN) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à consulter cette demande.");
      }
    }

    return this.mapToDto(inquiry);
  }

  /**
   * Mettre à jour le statut et/ou envoyer une réponse (Espace Agent / Propriétaire)
   */
  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateInquiryStatusDto,
  ): Promise<InquiryResponseDto> {
    const existing = await this.findOne(userId, id);

    const updated = await this.prisma.inquiry.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.response !== undefined && {
          response: dto.response,
          respondedAt: new Date(),
        }),
      },
      include: {
        client: true,
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

    // Si une réponse est apportée et que le client a un compte, lui envoyer une notification
    if (dto.response && updated.clientId) {
      await this.notificationsService.notifyNewMessage({
        recipientUserId: updated.clientId,
        senderName: 'L’agent en charge',
        conversationId: updated.id,
        messageExcerpt: dto.response.slice(0, 100),
      });
    }

    return this.mapToDto(updated);
  }

  /**
   * Supprimer une demande
   */
  async remove(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(userId, id);

    await this.prisma.inquiry.delete({
      where: { id },
    });

    return { success: true, message: 'Demande supprimée avec succès.' };
  }

  /**
   * Helper de transformation DTO
   */
  private mapToDto(inq: {
    id: string;
    listingId: string;
    clientId: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    subject: string;
    message: string;
    status: InquiryStatus;
    response: string | null;
    respondedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    client?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
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
    };
  }): InquiryResponseDto {
    return {
      id: inq.id,
      listingId: inq.listingId,
      clientId: inq.clientId,
      name: inq.name,
      email: inq.email,
      phone: inq.phone,
      subject: inq.subject,
      message: inq.message,
      status: inq.status,
      response: inq.response,
      respondedAt: inq.respondedAt,
      createdAt: inq.createdAt,
      updatedAt: inq.updatedAt,
      client: inq.client
        ? {
            id: inq.client.id,
            email: inq.client.email,
            firstName: inq.client.firstName,
            lastName: inq.client.lastName,
            phone: inq.client.phone,
          }
        : null,
      listing: inq.listing
        ? {
            id: inq.listing.id,
            title: inq.listing.title || inq.listing.property.title,
            transactionType: inq.listing.transactionType,
            city: inq.listing.property.location.city,
            primaryPhotoUrl: inq.listing.property.media[0]?.url,
            price: inq.listing.price?.price,
          }
        : null,
    };
  }
}
