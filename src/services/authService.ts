import { BaseApiService } from './base';
import {
  SignInRequest,
  SignInResponse,
  VerificationResponse,
  VerifyRequest,
  RefreshTokenRequest,
  AuthResponse,
} from '../types/api';

class AuthService extends BaseApiService {
  async signIn(request: SignInRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async verify(request: VerifyRequest): Promise<SignInResponse> {
    return this.makeRequest<SignInResponse>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async refreshToken(
    request: RefreshTokenRequest,
    accessToken: string
  ): Promise<SignInResponse> {
    return this.makeRequest<SignInResponse>('/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
  }

  async signOut(accessToken: string): Promise<void> {
    return this.makeRequest<void>('/auth/sign-out', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }
}

export const authService = new AuthService();
