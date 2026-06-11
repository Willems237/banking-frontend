// models/transaction.model.ts

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER'
  | 'PAYMENT'
  | 'PURCHASE';

export type TransactionStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'PENDING';

export interface Transaction {
  id:             number;
  reference:      string;       // UUID
  account:        number;       // FK id
  account_number: string;       // champ annoté read_only
  type:           TransactionType;
  status:         TransactionStatus;
  amount:         string;       // DecimalField → string JSON
  description:    string;
  date:           string;       // ISO 8601
}

// ✅ Filtres supportés par l'API Django
export interface TransactionFilters {
  type?:    TransactionType;
  account?: number;
  page?:    number;
}

// Labels lisibles pour le template
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  DEPOSIT:  'Dépôt',
  WITHDRAW: 'Retrait',
  TRANSFER: 'Virement',
  PAYMENT:  'Paiement',
  PURCHASE: 'Achat',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  SUCCESS: 'Succès',
  FAILED:  'Échoué',
  PENDING: 'En attente',
};