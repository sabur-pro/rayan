import { BaseApiService } from './base';
import { UserProfile, UpdateProfileRequest, ExtendedUserProfile, JWTPayload } from '../types/user';
import { UpdateUserRequest, UpdateUserResponse } from '../types/academic';

class UserService extends BaseApiService {
  async getProfile(accessToken: string): Promise<UserProfile> {
    return this.makeRequest<UserProfile>('/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async getUserById(userId: number, accessToken: string): Promise<ExtendedUserProfile> {
    return this.makeRequest<ExtendedUserProfile>(`/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async updateProfile(
    request: UpdateProfileRequest,
    accessToken: string
  ): Promise<UserProfile> {
    return this.makeRequest<UserProfile>('/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
  }

  async updateUserAcademicInfo(
    request: UpdateUserRequest,
    accessToken: string
  ): Promise<UpdateUserResponse> {
    return this.makeRequest<UpdateUserResponse>('/user', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
  }

  async deleteAccount(accessToken: string): Promise<void> {
    return this.makeRequest<void>('/user/account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  decodeJWT(token: string): JWTPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }
}

export const userService = new UserService();
