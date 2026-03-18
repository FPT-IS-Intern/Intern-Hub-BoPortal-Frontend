export interface LogoutRequest {
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
  deviceId?: string;
}

export interface LoginPayload {
  encryptedUsername: string;
  encryptedPassword: string;
  deviceId?: string;
}

export interface BoAdminProfile {
  id: string;
  username: string;
  displayName?: string;
  fullName?: string;
  roles?: string[];
  role?: string;
  permissions?: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  user?: BoAdminProfile;
}
