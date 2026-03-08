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
  user?: {
    id: string;
    username: string;
    fullName: string;
    role: string;
  };
  tokenType?: string;
  expiresIn?: number;
}
