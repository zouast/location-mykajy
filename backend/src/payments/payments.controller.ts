import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ProcessPaymentDto, RefundPaymentDto } from './dto/process-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import type { PaymentProviderType } from './interfaces/payment-provider.interface';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * 1. Initialiser une intention ou session de paiement (Stripe, Mobile Money, Virement, Manuel)
   */
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(@Request() req: any, @Body() dto: InitiatePaymentDto) {
    const userId = req.user.id || req.user.userId;
    return this.paymentsService.initiatePayment(userId, dto);
  }

  /**
   * 2. Exécuter / Confirmer le paiement (OTP Mobile Money, validation carte, etc.)
   */
  @Post(':id/process')
  @UseGuards(JwtAuthGuard)
  async processPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.paymentsService.processPayment(id, userId, dto);
  }

  /**
   * 3. Webhook passerelle de paiement (Stripe, Orange Money, Wave callbacks)
   */
  @Public()
  @Post('webhook/:provider')
  async handleWebhook(
    @Param('provider') provider: PaymentProviderType,
    @Body() payload: any,
  ) {
    return this.paymentsService.handleWebhook(provider, payload);
  }

  /**
   * 4. Consulter l'historique des paiements de l'utilisateur connecté
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyPayments(@Request() req: any, @Query() query: PaymentQueryDto) {
    const userId = req.user.id || req.user.userId;
    return this.paymentsService.getUserPayments(userId, query);
  }

  /**
   * 5. Consulter un paiement spécifique avec son reçu
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.paymentsService.getPaymentById(id, userId);
  }

  /**
   * 6. Rembourser un paiement
   */
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  async refundPayment(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(id, dto);
  }

  /**
   * 7. Annuler une demande de paiement en attente
   */
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelPayment(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.paymentsService.cancelPayment(id, userId);
  }
}
