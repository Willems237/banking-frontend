// models/auth.model.ts

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserProfile {
  role:         'ADMIN' | 'MANAGER' | 'CUSTOMER';
  phone_number: string;
  avatar:       string | null;
}

export interface AuthUser {
  id:         number;
  username:   string;
  email:      string;
  first_name: string;
  last_name:  string;
  profile:    UserProfile;
}

export interface LoginResponse {
  access:  string;
  refresh: string;
  user:    AuthUser;           // ✅ votre CustomTokenObtainPairSerializer
}

export interface RefreshResponse {
  access:   string;
  refresh?: string;            // rotation optionnelle
}