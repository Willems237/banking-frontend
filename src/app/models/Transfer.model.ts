// models/transfer.model.ts

export interface Transfer {
  id:        number;
  reference: string;    // UUID
  sender:    string;    // account_number (read_only)
  receiver:  string;    // account_number (read_only)
  amount:    string;    // DecimalField → string JSON
  description: string;
  date:      string;    // ISO 8601
}

// ✅ Payload envoyé depuis Angular vers Django
export interface CreateTransferPayload {
  sender_id:               number;   // ID du compte émetteur
  receiver_account_number: string;   // Numéro du compte destinataire
  amount:                  number;
  description?:            string;
}

// ✅ Réponse de POST /transfers/
export interface TransferResponse {
  message: string;
  data:    Transfer;
}

// Filtres pour la liste
export interface TransferFilters {
  page?: number;
}