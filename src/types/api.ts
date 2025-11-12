// Auth API Types
export interface SignInRequest {
  phone: string;
  password: string;
}

export interface SignInResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface VerificationResponse {
  message: string;
  txn_id: string;
}

export interface VerifyRequest {
  txn_id: string;
  verify_code: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Common API Types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Response Union Types
export type AuthResponse = SignInResponse | VerificationResponse;
