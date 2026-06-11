// models/admin.model.ts
import { AuthUser } from './auth.model';

export interface AdminStats {
  total_users:    number;
  active_accounts: number;
  total_volume:   number;
  total_transfers: number;
}

// On réutilise AuthUser de auth.model.ts — même structure
export type UserSummary = AuthUser & { is_active?: boolean };

export interface CreateStaffPayload {
  username:     string;
  email:        string;
  password:     string;
  role:         'ADMIN' | 'MANAGER';
  phone_number?: string;
}