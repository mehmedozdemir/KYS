export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  personId: string;
  fullName: string;
  permissions: string[];
}

export interface AuthUser {
  personId: string;
  fullName: string;
  permissions: string[];
  accessToken: string;
  refreshToken: string;
}
