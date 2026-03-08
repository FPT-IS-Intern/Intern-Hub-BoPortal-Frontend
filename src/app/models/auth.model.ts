export interface LogoutRequest {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
}

