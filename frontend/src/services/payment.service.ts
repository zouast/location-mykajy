import api from './api';
import type {
  PaymentItem,
  PaymentSessionResponse,
  InitiatePaymentInput,
  ProcessPaymentInput,
} from '@/types';

export const paymentService = {
  /** Initialiser une session ou intention de paiement */
  async initiatePayment(input: InitiatePaymentInput): Promise<PaymentSessionResponse> {
    const res = await api.post<{ data: PaymentSessionResponse } | PaymentSessionResponse>(
      '/payments/initiate',
      input,
    );
    return (res.data as { data: PaymentSessionResponse }).data || res.data;
  },

  /** Exécuter ou confirmer le paiement (OTP Mobile Money / carte / virement) */
  async processPayment(
    paymentId: string,
    input: ProcessPaymentInput,
  ): Promise<PaymentItem> {
    const res = await api.post<{ data: PaymentItem } | PaymentItem>(
      `/payments/${paymentId}/process`,
      input,
    );
    return (res.data as { data: PaymentItem }).data || res.data;
  },

  /** Récupérer la liste des paiements de l'utilisateur */
  async getMyPayments(
    page = 1,
    limit = 20,
    status?: string,
    type?: string,
  ): Promise<{ items: PaymentItem[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set('status', status);
    if (type) params.set('type', type);

    const res = await api.get<{ data: any } | any>(`/payments?${params.toString()}`);
    return (res.data as { data: any }).data || res.data;
  },

  /** Récupérer les détails d'un paiement spécifique avec son reçu */
  async getPaymentById(id: string): Promise<PaymentItem> {
    const res = await api.get<{ data: PaymentItem } | PaymentItem>(`/payments/${id}`);
    return (res.data as { data: PaymentItem }).data || res.data;
  },

  /** Annuler une demande de paiement en attente */
  async cancelPayment(id: string): Promise<PaymentItem> {
    const res = await api.patch<{ data: PaymentItem } | PaymentItem>(
      `/payments/${id}/cancel`,
    );
    return (res.data as { data: PaymentItem }).data || res.data;
  },
};
