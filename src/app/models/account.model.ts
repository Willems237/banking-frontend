// models/account.model.ts

export type AccountType = 'CURRENT' | 'SAVINGS' | 'MOBILE';

export interface Account {
  id:             number;
  user:           string;
  label:          string;
  account_type:   AccountType;
  account_number: string;
  balance:        string;        // DecimalField Django → string en JSON
  is_active:      boolean;
  created_at:     string;
  updated_at:     string;
}

export interface CreateAccountPayload {
  label:        string;
  account_type: AccountType;
}

export interface UpdateAccountPayload {
  label?:     string;
  is_active?: boolean;
}

// ✅ Réponse paginée Django REST Framework
export interface PaginatedResponse<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}