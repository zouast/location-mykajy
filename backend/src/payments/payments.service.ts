import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  PaymentMethod,
  PaymentProvider,
  PaymentProviderType,
  PaymentStatus,
  PaymentType,
} from './interfaces/payment-provider.interface';
import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { MobileMoneyPaymentProvider } from './providers/mobile-money-payment.provider';
import { BankTransferPaymentProvider } from './providers/bank-transfer-payment.provider';
import { ManualPaymentProvider } from './providers/manual-payment.provider';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ProcessPaymentDto, RefundPaymentDto } from './dto/process-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import {
  PaymentItemDto,
  PaymentSessionResponseDto,
} from './dto/payment-response.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providers: Map<PaymentProviderType, PaymentProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly stripeProvider: StripePaymentProvider,
    private readonly mobileMoneyProvider: MobileMoneyPaymentProvider,
    private readonly bankTransferProvider: BankTransferPaymentProvider,
    private readonly manualProvider: ManualPaymentProvider,
  ) {
    this.registerProvider(stripeProvider);
    this.registerProvider(mobileMoneyProvider);
    this.registerProvider(bankTransferProvider);
    this.registerProvider(manualProvider);
  }

  private registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.providerId, provider);
  }

  /**
   * Résout le provider approprié selon la méthode ou le provider explicite
   */
  private resolveProvider(
    providerType?: PaymentProviderType,
    method?: PaymentMethod,
  ): PaymentProvider {
    let targetType: PaymentProviderType = providerType || 'STRIPE';

    if (!providerType && method) {
      if (method === PaymentMethod.MOBILE_MONEY) targetType = 'MOBILE_MONEY';
      else if (method === PaymentMethod.BANK_TRANSFER) targetType = 'BANK_TRANSFER';
      else if (
        method === PaymentMethod.MANUAL ||
        method === PaymentMethod.CASH ||
        method === PaymentMethod.CHECK
      )
        targetType = 'MANUAL';
      else targetType = 'STRIPE';
    }

    const provider = this.providers.get(targetType);
    if (!provider) {
      throw new BadRequestException(`Fournisseur de paiement ${targetType} non supporté.`);
    }

    return provider;
  }

  /**
   * 1. Initialiser une intention ou session de paiement
   */
  async initiatePayment(
    userId: string,
    dto: InitiatePaymentDto,
  ): Promise<PaymentSessionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const provider = this.resolveProvider(dto.provider, dto.method);
    const transactionRef = `TRX-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Créer l'enregistrement de paiement en base
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        type: dto.type as any,
        amount: dto.amount,
        currency: dto.currency || 'EUR',
        status: PaymentStatus.PENDING as any,
        method: dto.method as any,
        provider: provider.providerId,
        transactionRef,
        description: dto.description,
        saleId: dto.saleId || undefined,
        rentalId: dto.rentalId || undefined,
        dueDate: new Date(),
        metadata: {
          ...dto.metadata,
          rentScheduleId: dto.rentScheduleId,
          commissionId: dto.commissionId,
        },
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        rental: { include: { listing: { select: { id: true, title: true } } } },
        sale: { include: { listing: { select: { id: true, title: true } } } },
      },
    });

    // Appeler le fournisseur pour initialiser la session / checkout
    const sessionResult = await provider.createPaymentSession({
      paymentId: payment.id,
      userId: user.id,
      userEmail: user.email,
      userPhone: dto.phone || user.phone || undefined,
      userName: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      amount: dto.amount,
      currency: dto.currency || 'EUR',
      type: dto.type,
      description: dto.description,
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
      metadata: { ...dto.metadata, paymentId: payment.id },
    });

    // Sauvegarder la référence fournisseur
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: sessionResult.providerRef,
        status: sessionResult.status as any,
      },
    });

    return {
      payment: this.mapPaymentToDto(payment),
      session: {
        provider: provider.providerId,
        providerRef: sessionResult.providerRef,
        status: sessionResult.status,
        checkoutUrl: sessionResult.checkoutUrl,
        qrCodeUrl: sessionResult.qrCodeUrl,
        ussdPromptCode: sessionResult.ussdPromptCode,
        instructions: sessionResult.instructions,
      },
    };
  }

  /**
   * 2. Exécuter ou confirmer un paiement
   */
  async processPayment(
    paymentId: string,
    userId: string,
    dto: ProcessPaymentDto,
  ): Promise<PaymentItemDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Paiement #${paymentId} introuvable.`);
    }

    if (payment.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à régler ce paiement.");
    }

    if (payment.status === (PaymentStatus.PAID as any) || payment.status === (PaymentStatus.COMPLETED as any)) {
      throw new BadRequestException('Ce paiement a déjà été validé et réglé.');
    }

    const provider = this.resolveProvider(payment.provider as PaymentProviderType, payment.method as any);

    const result = await provider.processPayment({
      paymentId,
      providerRef: dto.providerRef || payment.providerRef || undefined,
      otpCode: dto.otpCode,
      phoneNumber: dto.phoneNumber,
      metadata: dto.metadata,
    });

    if (result.success) {
      return this.confirmPayment(payment.id, result.transactionRef, result.receiptUrl);
    } else {
      return this.markAsFailed(payment.id, result.error || 'Échec de traitement auprès du fournisseur.');
    }
  }

  /**
   * 3. Confirmer le paiement et synchroniser les entités métier (Loyers, Commissions, Ventes)
   */
  async confirmPayment(
    paymentId: string,
    transactionRef: string,
    receiptUrl?: string,
  ): Promise<PaymentItemDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        rental: true,
        sale: true,
      },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID as any,
        paidAt: new Date(),
        transactionRef: transactionRef || payment.transactionRef,
        receiptUrl: receiptUrl || payment.receiptUrl,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        rental: { include: { listing: { select: { id: true, title: true } } } },
        sale: { include: { listing: { select: { id: true, title: true } } } },
      },
    });

    // Synchronisation métier spécifique :
    const meta = (payment.metadata as Record<string, any>) || {};

    // A. Échéance de loyer
    if (meta.rentScheduleId) {
      try {
        await this.prisma.rentSchedule.update({
          where: { id: meta.rentScheduleId },
          data: {
            status: PaymentStatus.COMPLETED as any,
            paidAt: new Date(),
            paymentId: updated.id,
            receiptUrl: updated.receiptUrl,
          },
        });
      } catch (err: any) {
        this.logger.warn(`Could not update rent schedule ${meta.rentScheduleId}: ${err.message}`);
      }
    }

    // B. Commission d'agence
    if (meta.commissionId) {
      try {
        await this.prisma.commission.update({
          where: { id: meta.commissionId },
          data: {
            status: 'PAID' as any,
            paidAt: new Date(),
          },
        });
      } catch (err: any) {
        this.logger.warn(`Could not update commission ${meta.commissionId}: ${err.message}`);
      }
    }

    // C. Notification multi-canaux
    await this.notificationsService.notifyPaymentReceived({
      recipientUserId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      paymentId: payment.id,
      description: payment.description || undefined,
    });

    return this.mapPaymentToDto(updated);
  }

  /**
   * 4. Marquer un paiement en échec
   */
  async markAsFailed(paymentId: string, reason: string): Promise<PaymentItemDto> {
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED as any,
        failedReason: reason,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        rental: { include: { listing: { select: { id: true, title: true } } } },
        sale: { include: { listing: { select: { id: true, title: true } } } },
      },
    });

    // Notification d'échec
    await this.notificationsService.notifyPaymentFailed({
      recipientUserId: updated.userId,
      amount: updated.amount,
      currency: updated.currency,
      reason,
      paymentId: updated.id,
    });

    return this.mapPaymentToDto(updated);
  }

  /**
   * 5. Rembourser un paiement (Admin / Gestionnaire)
   */
  async refundPayment(
    paymentId: string,
    dto: RefundPaymentDto,
  ): Promise<{ success: boolean; refundId: string; payment: PaymentItemDto }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.status !== (PaymentStatus.PAID as any) && payment.status !== (PaymentStatus.COMPLETED as any)) {
      throw new BadRequestException('Seuls les paiements validés peuvent faire l’objet d’un remboursement.');
    }

    const provider = this.resolveProvider(payment.provider as PaymentProviderType, payment.method as any);
    const refundResult = await provider.refundPayment(
      payment.providerRef || payment.transactionRef || payment.id,
      dto.amount || payment.amount,
      dto.reason,
    );

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED as any,
        metadata: {
          ...((payment.metadata as object) || {}),
          refundId: refundResult.refundId,
          refundReason: dto.reason,
          refundedAt: refundResult.refundedAt,
        },
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        rental: { include: { listing: { select: { id: true, title: true } } } },
        sale: { include: { listing: { select: { id: true, title: true } } } },
      },
    });

    return {
      success: true,
      refundId: refundResult.refundId,
      payment: this.mapPaymentToDto(updated),
    };
  }

  /**
   * 6. Annuler une demande de paiement en attente
   */
  async cancelPayment(paymentId: string, userId: string): Promise<PaymentItemDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.userId !== userId) throw new ForbiddenException("Action non autorisée");

    if (payment.status !== (PaymentStatus.PENDING as any) && payment.status !== (PaymentStatus.PROCESSING as any)) {
      throw new BadRequestException('Impossible d’annuler un paiement déjà traité.');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.CANCELLED as any },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        rental: { include: { listing: { select: { id: true, title: true } } } },
        sale: { include: { listing: { select: { id: true, title: true } } } },
      },
    });

    return this.mapPaymentToDto(updated);
  }

  /**
   * 7. Consulter l'historique des paiements de l'utilisateur connecté
   */
  async getUserPayments(
    userId: string,
    query: PaymentQueryDto,
  ): Promise<{ items: PaymentItemDto[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, status, type, rentalId, saleId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      ...(status ? { status: status as any } : {}),
      ...(type ? { type: type as any } : {}),
      ...(rentalId ? { rentalId } : {}),
      ...(saleId ? { saleId } : {}),
    };

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          rental: { include: { listing: { select: { id: true, title: true } } } },
          sale: { include: { listing: { select: { id: true, title: true } } } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: payments.map((p) => this.mapPaymentToDto(p)),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 8. Consulter un paiement spécifique
   */
  async getPaymentById(paymentId: string, userId: string): Promise<PaymentItemDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        rental: { include: { listing: { select: { id: true, title: true } } } },
        sale: { include: { listing: { select: { id: true, title: true } } } },
      },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.userId !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à ce reçu de paiement.");
    }

    return this.mapPaymentToDto(payment);
  }

  /**
   * 9. Webhook unifié multi-fournisseurs (Stripe, Mobile Money callbacks)
   */
  async handleWebhook(providerType: PaymentProviderType, payload: any): Promise<{ received: boolean }> {
    this.logger.log(`[Webhook ${providerType}] Payload reçu : ${JSON.stringify(payload).slice(0, 120)}...`);

    const providerRef =
      payload.providerRef ||
      payload.id ||
      payload.data?.object?.id ||
      payload.transaction_id;

    if (providerRef) {
      const payment = await this.prisma.payment.findFirst({
        where: { providerRef },
      });

      if (payment) {
        const isSuccess =
          payload.status === 'succeeded' ||
          payload.status === 'SUCCESSFUL' ||
          payload.type === 'checkout.session.completed';

        if (isSuccess) {
          await this.confirmPayment(payment.id, `tx_${providerRef}`);
        }
      }
    }

    return { received: true };
  }

  private mapPaymentToDto(p: any): PaymentItemDto {
    return {
      id: p.id,
      userId: p.userId,
      type: p.type,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      method: p.method,
      provider: p.provider,
      providerRef: p.providerRef,
      transactionRef: p.transactionRef,
      description: p.description,
      dueDate: p.dueDate,
      paidAt: p.paidAt,
      failedReason: p.failedReason,
      receiptUrl: p.receiptUrl,
      saleId: p.saleId,
      rentalId: p.rentalId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      user: p.user,
      rental: p.rental,
      sale: p.sale,
    };
  }
}
