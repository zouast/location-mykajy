import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  NotificationChannel,
  NotificationDeliveryResult,
  NotificationPayload,
  NotificationProvider,
  NotificationType,
} from './interfaces/notification-provider.interface';
import { InAppNotificationProvider } from './providers/in-app-notification.provider';
import { EmailNotificationProvider } from './providers/email-notification.provider';
import { SmsNotificationProvider } from './providers/sms-notification.provider';
import { WhatsAppNotificationProvider } from './providers/whatsapp-notification.provider';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly providers: Map<NotificationChannel, NotificationProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly inAppProvider: InAppNotificationProvider,
    private readonly emailProvider: EmailNotificationProvider,
    private readonly smsProvider: SmsNotificationProvider,
    private readonly whatsAppProvider: WhatsAppNotificationProvider,
  ) {
    this.registerProvider(inAppProvider);
    this.registerProvider(emailProvider);
    this.registerProvider(smsProvider);
    this.registerProvider(whatsAppProvider);
  }

  /** Enregistrement dynamique d'un fournisseur de notification */
  private registerProvider(provider: NotificationProvider) {
    this.providers.set(provider.channel, provider);
  }

  /**
   * Envoi générique d'une notification multi-canaux
   */
  async send(payload: NotificationPayload): Promise<{
    results: NotificationDeliveryResult[];
    successfulChannels: NotificationChannel[];
    failedChannels: NotificationChannel[];
  }> {
    // Enrichir avec les informations utilisateur si manquantes
    let enrichedPayload = { ...payload };

    if ((!enrichedPayload.userEmail || !enrichedPayload.userPhone || !enrichedPayload.userName) && enrichedPayload.userId) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: enrichedPayload.userId },
          select: { email: true, phone: true, firstName: true, lastName: true },
        });

        if (user) {
          enrichedPayload = {
            ...enrichedPayload,
            userEmail: enrichedPayload.userEmail || user.email,
            userPhone: enrichedPayload.userPhone || user.phone || undefined,
            userName:
              enrichedPayload.userName ||
              (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Could not enrich user data for ${enrichedPayload.userId}: ${err.message}`);
      }
    }

    // Canaux par défaut : IN_APP et EMAIL
    const targetChannels =
      enrichedPayload.channels && enrichedPayload.channels.length > 0
        ? enrichedPayload.channels
        : [NotificationChannel.IN_APP, NotificationChannel.EMAIL];

    const results: NotificationDeliveryResult[] = [];
    const successfulChannels: NotificationChannel[] = [];
    const failedChannels: NotificationChannel[] = [];

    for (const channel of targetChannels) {
      const provider = this.providers.get(channel);

      if (!provider) {
        this.logger.warn(`No provider registered for channel: ${channel}`);
        const failedRes: NotificationDeliveryResult = {
          success: false,
          channel,
          error: `Provider for ${channel} not found`,
          timestamp: new Date(),
        };
        results.push(failedRes);
        failedChannels.push(channel);
        continue;
      }

      if (!provider.isAvailable()) {
        this.logger.warn(`Provider for ${channel} is currently unavailable`);
        continue;
      }

      try {
        const result = await provider.send(enrichedPayload);
        results.push(result);

        if (result.success) {
          successfulChannels.push(channel);
        } else {
          failedChannels.push(channel);
        }

        // Journaliser la tentative dans NotificationLog
        try {
          await (this.prisma as any).notificationLog?.create({
            data: {
              userId: enrichedPayload.userId,
              recipient:
                channel === NotificationChannel.EMAIL
                  ? enrichedPayload.userEmail || 'unknown'
                  : channel === NotificationChannel.SMS || channel === NotificationChannel.WHATSAPP
                  ? enrichedPayload.userPhone || 'unknown'
                  : enrichedPayload.userId,
              type: enrichedPayload.type as any,
              channel: channel as any,
              title: enrichedPayload.title,
              content: enrichedPayload.content,
              status: result.success ? 'SENT' : 'FAILED',
              error: result.error,
              messageId: result.messageId,
              metadata: enrichedPayload.metadata || {},
            },
          });
        } catch {
          // Si la table de log n'est pas encore migrée
        }
      } catch (err: any) {
        this.logger.error(`Error sending via ${channel}: ${err.message}`, err.stack);
        const errResult: NotificationDeliveryResult = {
          success: false,
          channel,
          error: err.message,
          timestamp: new Date(),
        };
        results.push(errResult);
        failedChannels.push(channel);
      }
    }

    return { results, successfulChannels, failedChannels };
  }

  // ─── Helpers d'événements Métier ───

  /** 1. Nouvelle demande d'information sur une annonce */
  async notifyNewInquiry(data: {
    recipientUserId: string;
    listingTitle: string;
    senderName: string;
    inquiryId: string;
    messagePreview?: string;
  }) {
    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.NEW_INQUIRY,
      title: 'Nouvelle demande reçue',
      content: `${data.senderName} vous a envoyé une demande concernant votre annonce "${data.listingTitle}".${
        data.messagePreview ? ` "${data.messagePreview}"` : ''
      }`,
      link: `/inquiries`,
      actionText: 'Consulter la demande',
      metadata: { inquiryId: data.inquiryId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  /** 2. Demande de visite d'un bien */
  async notifyVisitRequested(data: {
    recipientUserId: string;
    listingTitle: string;
    clientName: string;
    visitDate: Date;
    visitId: string;
  }) {
    const formattedDate = new Date(data.visitDate).toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.VISIT_REQUESTED,
      title: 'Demande de visite',
      content: `${data.clientName} souhaite visiter votre bien "${data.listingTitle}" le ${formattedDate}.`,
      link: `/visits`,
      actionText: 'Confirmer ou modifier la visite',
      metadata: { visitId: data.visitId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
    });
  }

  /** 3. Confirmation de visite */
  async notifyVisitConfirmed(data: {
    recipientUserId: string;
    listingTitle: string;
    visitDate: Date;
    visitId: string;
  }) {
    const formattedDate = new Date(data.visitDate).toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.VISIT_CONFIRMED,
      title: 'Visite confirmée !',
      content: `Votre visite pour le bien "${data.listingTitle}" a été confirmée pour le ${formattedDate}.`,
      link: `/visits`,
      actionText: 'Voir mon agenda',
      metadata: { visitId: data.visitId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.WHATSAPP],
    });
  }

  /** 4. Annulation de visite */
  async notifyVisitCancelled(data: {
    recipientUserId: string;
    listingTitle: string;
    reason?: string;
    visitId: string;
  }) {
    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.VISIT_CANCELLED,
      title: 'Visite annulée',
      content: `La visite prévue pour le bien "${data.listingTitle}" a été annulée.${
        data.reason ? ` Motif : ${data.reason}` : ''
      }`,
      link: `/visits`,
      actionText: 'Détails des visites',
      metadata: { visitId: data.visitId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
    });
  }

  /** 5. Annonce approuvée / publiée */
  async notifyListingApproved(data: {
    recipientUserId: string;
    listingTitle: string;
    listingId: string;
    listingSlug?: string;
  }) {
    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.LISTING_APPROVED,
      title: 'Annonce validée et publiée !',
      content: `Félicitations, votre annonce "${data.listingTitle}" est désormais visible sur la plateforme.`,
      link: `/properties/${data.listingSlug || data.listingId}`,
      actionText: 'Voir mon annonce',
      metadata: { listingId: data.listingId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  /** 6. Annonce rejetée / modifications requises */
  async notifyListingRejected(data: {
    recipientUserId: string;
    listingTitle: string;
    reason?: string;
    listingId: string;
  }) {
    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.LISTING_REJECTED,
      title: 'Annonce à corriger',
      content: `Votre annonce "${data.listingTitle}" nécessite des ajustements avant publication.${
        data.reason ? ` Motif : ${data.reason}` : ''
      }`,
      link: `/owner/listings`,
      actionText: 'Modifier mon annonce',
      metadata: { listingId: data.listingId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  /** 7. Nouveau message reçu */
  async notifyNewMessage(data: {
    recipientUserId: string;
    senderName: string;
    conversationId: string;
    messageExcerpt?: string;
  }) {
    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.NEW_MESSAGE,
      title: `Message de ${data.senderName}`,
      content: data.messageExcerpt
        ? `"${data.messageExcerpt}"`
        : `Vous avez reçu un nouveau message de ${data.senderName}.`,
      link: `/owner/messages`,
      actionText: 'Répondre',
      metadata: { conversationId: data.conversationId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  /** 8. Paiement reçu avec succès */
  async notifyPaymentReceived(data: {
    recipientUserId: string;
    amount: number;
    currency?: string;
    paymentId: string;
    description?: string;
  }) {
    const cur = data.currency || 'EUR';
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: cur,
    }).format(data.amount);

    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Paiement confirmé',
      content: `Nous confirmons la bonne réception de votre règlement de ${formattedAmount}${
        data.description ? ` (${data.description})` : ''
      }.`,
      link: `/rentals`,
      actionText: 'Consulter mes reçus',
      metadata: { paymentId: data.paymentId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  /** 9. Échec de paiement */
  async notifyPaymentFailed(data: {
    recipientUserId: string;
    amount: number;
    currency?: string;
    reason?: string;
    paymentId?: string;
  }) {
    const cur = data.currency || 'EUR';
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: cur,
    }).format(data.amount);

    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.PAYMENT_FAILED,
      title: 'Échec de traitement du paiement',
      content: `Le paiement d'un montant de ${formattedAmount} n'a pas pu aboutir.${
        data.reason ? ` Raison : ${data.reason}` : ''
      } Veuillez régulariser votre moyen de paiement.`,
      link: `/rentals`,
      actionText: 'Régulariser mon paiement',
      metadata: { paymentId: data.paymentId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
    });
  }

  /** 10. Correspondance avec une recherche sauvegardée */
  async notifySavedSearchMatch(data: {
    recipientUserId: string;
    searchName: string;
    listingTitle: string;
    listingId: string;
    listingSlug?: string;
    price?: number;
    city?: string;
  }) {
    const priceInfo = data.price ? ` à ${data.price.toLocaleString('fr-FR')} €` : '';
    const cityInfo = data.city ? ` à ${data.city}` : '';

    return this.send({
      userId: data.recipientUserId,
      type: NotificationType.SAVED_SEARCH_MATCH,
      title: 'Nouveau bien pour votre recherche !',
      content: `Un bien correspondant à votre alerte "${data.searchName}" vient d'être publié : ${data.listingTitle}${cityInfo}${priceInfo}.`,
      link: `/properties/${data.listingSlug || data.listingId}`,
      actionText: 'Découvrir ce bien',
      metadata: { listingId: data.listingId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  // ─── Gestion In-App pour l'utilisateur connecté ───

  /** Récupère les notifications in-app paginées de l'utilisateur */
  async getUserNotifications(userId: string, query: NotificationQueryDto) {
    const { page = 1, limit = 20, unreadOnly, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }
    if (type) {
      where.type = type;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /** Récupère le compteur de notifications non lues */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  /** Marquer une notification comme lue */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification non trouvée');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** Marquer toutes les notifications comme lues */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true, message: 'Toutes les notifications ont été marquées comme lues' };
  }

  /** Supprimer une notification */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification non trouvée');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  /** Supprimer toutes les notifications lues de l'utilisateur */
  async clearAll(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });

    return { success: true, message: 'Les notifications lues ont été supprimées' };
  }
}
