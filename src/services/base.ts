import { ApiError } from '../types/api';

export const API_BASE_URL = 'https://api.medlife.tj';

// Type for refresh token callback
type RefreshTokenCallback = () => Promise<boolean>;

let refreshTokenCallback: RefreshTokenCallback | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export class BaseApiService {
  static setRefreshTokenCallback(callback: RefreshTokenCallback) {
    refreshTokenCallback = callback;
  }

  static setUnauthorizedCallback(callback: () => void) {
    onUnauthorizedCallback = callback;
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false,
    skipDefaultContentType: boolean = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = skipDefaultContentType
      ? {}
      : { 'Content-Type': 'application/json' };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized
      if (response.status === 401 && !isRetry && refreshTokenCallback) {
        console.log('Received 401, attempting to refresh token...');
        
        const refreshSuccess = await refreshTokenCallback();
        
        if (refreshSuccess) {
          // Get new access token from storage
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const newAccessToken = await AsyncStorage.getItem('accessToken');
          
          if (newAccessToken) {
            // Update Authorization header with new token
            const updatedOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newAccessToken}`,
              },
            };
            
            // Retry the request with new token
            console.log('Token refreshed successfully, retrying request...');
            return this.makeRequest<T>(endpoint, updatedOptions, true, skipDefaultContentType);
          }
        }
        
        // Refresh failed, logout user
        console.log('Token refresh failed, logging out...');
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        throw new ApiError('Session expired. Please login again.', 401);
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle 402 Payment Required - subscription needed
        if (response.status === 402) {
          console.log('Received 402 - subscription required');
          throw new ApiError(
            data.message || 'Subscription required',
            402,
            data
          );
        }
        
        throw new ApiError(
          data.message || `HTTP Error ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred'
      );
    }
  }
}
