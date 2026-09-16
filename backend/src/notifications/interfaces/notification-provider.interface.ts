export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum NotificationType {
  NEW_INQUIRY = 'NEW_INQUIRY',
  VISIT_REQUESTED = 'VISIT_REQUESTED',
  VISIT_CONFIRMED = 'VISIT_CONFIRMED',
  VISIT_CANCELLED = 'VISIT_CANCELLED',
  LISTING_APPROVED = 'LISTING_APPROVED',
  LISTING_REJECTED = 'LISTING_REJECTED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SAVED_SEARCH_MATCH = 'SAVED_SEARCH_MATCH',
  SYSTEM = 'SYSTEM',
}

export interface NotificationPayload {
  userId?: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  type: NotificationType | string;
  title: string;
  content: string;
  link?: string;
  actionText?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, any>;
}

export interface NotificationDeliveryResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;

  /**
   * Envoie une notification via ce canal
   */
  send(payload: NotificationPayload): Promise<NotificationDeliveryResult>;

  /**
   * Indique si le provider est disponible et configuré
   */
  isAvailable(): boolean;
}
