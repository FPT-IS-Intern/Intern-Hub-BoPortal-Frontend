export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthTokenPair {
  accessToken: string;
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

export interface BoAdminProfileResponse extends BoAdminProfile {
  user?: BoAdminProfile;
}

export interface LoginResponse extends AuthTokenPair {
  tokenType?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  user?: BoAdminProfile;
}

export interface PublicKeyPayload {
  publicKey?: string;
  key?: string;
}
