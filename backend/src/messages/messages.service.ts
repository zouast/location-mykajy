import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConversationsWsService } from './conversations-ws.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationQueryDto, MessageQueryDto } from './dto/conversation-query.dto';
import {
  ConversationResponseDto,
  MessageDto,
} from './dto/conversation-response.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly wsService: ConversationsWsService,
  ) {}

  /**
   * Créer une nouvelle conversation ou récupérer une conversation existante entre deux utilisateurs
   */
  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    if (userId === dto.recipientId) {
      throw new BadRequestException('Vous ne pouvez pas créer une conversation avec vous-même.');
    }

    // Vérifier l'existence du destinataire
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!recipient) {
      throw new NotFoundException('Le destinataire spécifié est introuvable.');
    }

    // Vérifier si une conversation existe déjà entre ces deux utilisateurs (et pour ce bien si fourni)
    const existingConversations = await this.prisma.conversation.findMany({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: dto.recipientId } } },
          dto.listingId ? { listingId: dto.listingId } : {},
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
                phone: true,
              },
            },
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

    let conversation = existingConversations[0];

    if (!conversation) {
      // Créer une nouvelle conversation avec les deux participants
      conversation = await this.prisma.conversation.create({
        data: {
          subject: dto.subject,
          listingId: dto.listingId || undefined,
          listingRef: dto.listingId || undefined,
          lastMessageAt: new Date(),
          participants: {
            create: [
              { userId, hasUnread: false, lastReadAt: new Date() },
              { userId: dto.recipientId, hasUnread: true },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  role: true,
                  phone: true,
                },
              },
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
    }

    // Ajouter le message initial
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: dto.initialMessage,
        attachmentUrl: dto.attachmentUrl,
        attachmentName: dto.attachmentName,
        attachmentSize: dto.attachmentSize,
        attachmentType: dto.attachmentType,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    // Mettre à jour l'état unread du destinataire et le lastMessageAt
    await Promise.all([
      this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      }),
      this.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: conversation.id,
          userId: { not: userId },
        },
        data: { hasUnread: true },
      }),
    ]);

    // Déclencher la notification multi-canaux
    const sender = conversation.participants.find((p) => p.userId === userId)?.user;
    const senderDisplayName = sender
      ? [sender.firstName, sender.lastName].filter(Boolean).join(' ') || sender.email
      : 'Un utilisateur';

    await this.notificationsService.notifyNewMessage({
      recipientUserId: dto.recipientId,
      senderName: senderDisplayName,
      conversationId: conversation.id,
      messageExcerpt: dto.initialMessage.slice(0, 100),
    });

    // Diffuser via WebSocket
    this.wsService.emitNewMessage(conversation.id, message as any, [dto.recipientId]);

    return this.mapConversationToDto(conversation, message, userId);
  }

  /**
   * Récupérer toutes les conversations d'un utilisateur connecté
   */
  async getUserConversations(
    userId: string,
    query: ConversationQueryDto,
  ): Promise<{ items: ConversationResponseDto[]; total: number; unreadCount: number }> {
    const { page = 1, limit = 20, search, unreadOnly, listingId, archived = false } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isArchived: archived,
      participants: {
        some: {
          userId,
          ...(unreadOnly ? { hasUnread: true } : {}),
        },
      },
      ...(listingId ? { listingId } : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: 'insensitive' } },
              {
                messages: {
                  some: {
                    content: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [conversations, total, unreadCount] = await Promise.all([
      this.prisma.conversation.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  role: true,
                  phone: true,
                },
              },
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
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.conversation.count({ where: whereClause }),
      this.prisma.conversationParticipant.count({
        where: { userId, hasUnread: true },
      }),
    ]);

    const items = conversations.map((conv) =>
      this.mapConversationToDto(conv, conv.messages[0] || null, userId),
    );

    return { items, total, unreadCount };
  }

  /**
   * Récupérer les détails d'une conversation
   */
  async getConversationById(conversationId: string, userId: string): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
                phone: true,
              },
            },
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable.');
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException("Vous n'êtes pas participant de cette conversation.");
    }

    return this.mapConversationToDto(conversation, conversation.messages[0] || null, userId);
  }

  /**
   * Récupérer les messages paginés d'une conversation
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    query: MessageQueryDto,
  ): Promise<{ items: MessageDto[]; total: number }> {
    // Vérifier l'appartenance
    await this.getConversationById(conversationId, userId);

    const { page = 1, limit = 50, before } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      conversationId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      items: messages.map((m) => this.mapMessageToDto(m)),
      total,
    };
  }

  /**
   * Envoyer un message dans une conversation existante
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<MessageDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable.');
    }

    const isParticipant = conversation.participants.some((p) => p.userId === senderId);
    if (!isParticipant) {
      throw new ForbiddenException("Vous n'êtes pas participant de cette conversation.");
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: dto.content,
        attachmentUrl: dto.attachmentUrl,
        attachmentName: dto.attachmentName,
        attachmentSize: dto.attachmentSize,
        attachmentType: dto.attachmentType,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    // Mettre à jour la date du dernier message et notifier les autres participants
    const otherParticipants = conversation.participants.filter((p) => p.userId !== senderId);
    const recipientIds = otherParticipants.map((p) => p.userId);

    await Promise.all([
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date(), isArchived: false },
      }),
      this.prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId: { not: senderId },
        },
        data: { hasUnread: true },
      }),
    ]);

    // Diffuser les notifications multi-canaux
    const sender = conversation.participants.find((p) => p.userId === senderId)?.user;
    const senderDisplayName = sender
      ? [sender.firstName, sender.lastName].filter(Boolean).join(' ') || sender.email
      : 'Un utilisateur';

    for (const recipientId of recipientIds) {
      // Si l'utilisateur n'est pas actif sur le chat en direct, envoyer notification push/email
      if (!this.wsService.isUserOnline(recipientId)) {
        await this.notificationsService.notifyNewMessage({
          recipientUserId: recipientId,
          senderName: senderDisplayName,
          conversationId,
          messageExcerpt: dto.content.slice(0, 100),
        });
      }
    }

    // Diffusion WebSocket instantanée
    const messageDto = this.mapMessageToDto(message);
    this.wsService.emitNewMessage(conversationId, messageDto, recipientIds);

    return messageDto;
  }

  /**
   * Marquer tous les messages d'une conversation comme lus
   */
  async markAsRead(conversationId: string, userId: string): Promise<{ success: boolean }> {
    await this.getConversationById(conversationId, userId);

    await Promise.all([
      // Marquer les messages envoyés par les autres comme lus
      this.prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      }),
      // Marquer le participant sans messages non lus
      this.prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          hasUnread: false,
          lastReadAt: new Date(),
        },
      }),
    ]);

    this.wsService.emitMessageRead(conversationId, userId);

    return { success: true };
  }

  /**
   * Archiver ou désarchiver une conversation
   */
  async toggleArchive(conversationId: string, userId: string): Promise<{ isArchived: boolean }> {
    const conversation = await this.getConversationById(conversationId, userId);

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isArchived: !conversation.isArchived },
      select: { isArchived: true },
    });

    return { isArchived: updated.isArchived };
  }

  /**
   * Helpers de mapping DTO
   */
  private mapConversationToDto(
    conv: any,
    lastMsg: any,
    currentUserId: string,
  ): ConversationResponseDto {
    const userParticipant = conv.participants.find((p: any) => p.userId === currentUserId);

    return {
      id: conv.id,
      subject: conv.subject,
      listingId: conv.listingId || conv.listingRef,
      isArchived: conv.isArchived,
      lastMessageAt: conv.lastMessageAt || conv.updatedAt,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      unreadCount: userParticipant?.hasUnread ? 1 : 0,
      participants: conv.participants.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        hasUnread: p.hasUnread,
        lastReadAt: p.lastReadAt,
        user: {
          id: p.user.id,
          email: p.user.email,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          avatarUrl: p.user.avatarUrl,
          role: p.user.role,
          phone: p.user.phone,
        },
      })),
      lastMessage: lastMsg ? this.mapMessageToDto(lastMsg) : null,
      listing: conv.listing
        ? {
            id: conv.listing.id,
            title: conv.listing.title || conv.listing.property?.title,
            transactionType: conv.listing.transactionType,
            city: conv.listing.property?.location?.city,
            price: conv.listing.price?.price,
            primaryPhotoUrl: conv.listing.property?.media?.[0]?.url,
          }
        : null,
    };
  }

  private mapMessageToDto(m: any): MessageDto {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      isRead: m.isRead,
      isEdited: m.isEdited,
      attachmentUrl: m.attachmentUrl,
      attachmentName: m.attachmentName,
      attachmentSize: m.attachmentSize,
      attachmentType: m.attachmentType,
      readAt: m.readAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      sender: m.sender
        ? {
            id: m.sender.id,
            email: m.sender.email,
            firstName: m.sender.firstName,
            lastName: m.sender.lastName,
            avatarUrl: m.sender.avatarUrl,
            role: m.sender.role,
          }
        : null,
    };
  }
}
