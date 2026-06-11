// models/notification.model.ts

export type NotificationType =
  | 'TRANSFER_SENT'
  | 'TRANSFER_RECEIVED'
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'PAYMENT'
  | 'LOGIN'
  | 'ERROR';

export interface Notification {
  id:         number;
  type:       NotificationType;
  message:    string;
  is_read:    boolean;
  created_at: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  TRANSFER_SENT:     'Virement envoyé',
  TRANSFER_RECEIVED: 'Virement reçu',
  DEPOSIT:           'Dépôt reçu',
  WITHDRAW:          'Retrait effectué',
  PAYMENT:           'Paiement effectué',
  LOGIN:             'Connexion',
  ERROR:             'Erreur',
};

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  TRANSFER_SENT:     'ti-arrow-up-right',
  TRANSFER_RECEIVED: 'ti-arrow-down-left',
  DEPOSIT:           'ti-coins',
  WITHDRAW:          'ti-cash',
  PAYMENT:           'ti-receipt',
  LOGIN:             'ti-lock',
  ERROR:             'ti-alert-circle',
};