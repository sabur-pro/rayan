import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { BaseApiService } from '../services/base';
import { Subscription } from '../types/subscription';

console.log('[AuthContext Module] Loading...');

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  subscription: Subscription | null;
  needsSubscription: boolean;
  isCheckingSubscription: boolean;
  login: (tokens: { access_token: string; refresh_token: string; expires_in: number }) => Promise<void>;
  logout: () => void;
  completeWelcome: () => void;
  refreshAccessToken: () => Promise<boolean>;
  checkSubscription: (token: string) => Promise<boolean>;
  handleSubscriptionComplete: (tokens: { access_token: string; refresh_token: string; expires_in: number }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Verify Context was created properly
if (!AuthContext) {
  console.error('[AuthContext] CRITICAL: createContext returned undefined!');
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth: AuthContext is undefined. Make sure AuthProvider is properly mounted.');
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('[AuthProvider] Initializing...');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        
        // Check subscription status
        const hasSubscription = await checkSubscription(storedAccessToken);
        if (hasSubscription) {
          setIsAuthenticated(true);
        } else {
          setNeedsSubscription(true);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkSubscription = useCallback(async (token: string): Promise<boolean> => {
    try {
      setIsCheckingSubscription(true);
      const subscriptionData = await apiService.getCurrentSubscription(false, token);
      
      if (subscriptionData.status === 'active' && subscriptionData.is_active) {
        // Get subscription with tokens
        const subscriptionWithTokens = await apiService.getCurrentSubscription(true, token);
        setSubscription(subscriptionWithTokens);
        
        // Update tokens if new ones are provided
        if (subscriptionWithTokens.access_token && subscriptionWithTokens.refresh_token) {
          await AsyncStorage.setItem('accessToken', subscriptionWithTokens.access_token);
          await AsyncStorage.setItem('refreshToken', subscriptionWithTokens.refresh_token);
          setAccessToken(subscriptionWithTokens.access_token);
          setRefreshToken(subscriptionWithTokens.refresh_token);
        }
        
        setNeedsSubscription(false);
        return true;
      }
      
      setNeedsSubscription(true);
      return false;
    } catch (error: any) {
      console.log('Subscription check error:', error);
      if (error.status === 404) {
        // No subscription found
        setNeedsSubscription(true);
        return false;
      }
      // Other errors, assume no subscription needed for now
      return false;
    } finally {
      setIsCheckingSubscription(false);
    }
  }, []);

  const login = useCallback(async (tokens: { access_token: string; refresh_token: string; expires_in: number }) => {
    try {
      await AsyncStorage.setItem('accessToken', tokens.access_token);
      await AsyncStorage.setItem('refreshToken', tokens.refresh_token);
      
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      
      // Check subscription after login
      const hasSubscription = await checkSubscription(tokens.access_token);
      if (hasSubscription) {
        setIsAuthenticated(true);
      }
      // If no subscription, needsSubscription will be set to true by checkSubscription
    } catch (error) {
      console.error('Error during login:', error);
    }
  }, [checkSubscription]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      // Read tokens from AsyncStorage to avoid stale closure values
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      
      if (!storedRefreshToken || !storedAccessToken) {
        console.log('No tokens available for refresh');
        return false;
      }

      console.log('Attempting to refresh token...');
      const response = await apiService.refreshToken(
        { refresh_token: storedRefreshToken },
        storedAccessToken
      );

      await AsyncStorage.setItem('accessToken', response.access_token);
      await AsyncStorage.setItem('refreshToken', response.refresh_token);
      
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      
      console.log('Token refresh successful');
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }, []);

  const handleSubscriptionComplete = useCallback(async (tokens: { access_token: string; refresh_token: string; expires_in: number }) => {
    try {
      await AsyncStorage.setItem('accessToken', tokens.access_token);
      await AsyncStorage.setItem('refreshToken', tokens.refresh_token);
      
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      setNeedsSubscription(false);
      setIsAuthenticated(true);
      
      // Fetch subscription details
      await checkSubscription(tokens.access_token);
    } catch (error) {
      console.error('Error completing subscription:', error);
    }
  }, [checkSubscription]);

  const logout = useCallback(async () => {
    try {
      const currentAccessToken = await AsyncStorage.getItem('accessToken');
      if (currentAccessToken) {
        await apiService.signOut(currentAccessToken);
      }
    } catch (error) {
      console.error('Error during API logout:', error);
    }
    
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      setAccessToken(null);
      setRefreshToken(null);
      setSubscription(null);
      setNeedsSubscription(false);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout cleanup:', error);
    }
  }, []);

  const completeWelcome = useCallback(() => {
    // This is handled by the LanguageContext
    // Just a placeholder for navigation flow
  }, []);

  // Setup callbacks for BaseApiService
  useEffect(() => {
    BaseApiService.setRefreshTokenCallback(refreshAccessToken);
    BaseApiService.setUnauthorizedCallback(logout);
  }, [refreshAccessToken, logout]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      accessToken,
      refreshToken,
      subscription,
      needsSubscription,
      isCheckingSubscription,
      login,
      logout,
      completeWelcome,
      refreshAccessToken,
      checkSubscription,
      handleSubscriptionComplete,
    }),
    [
      isAuthenticated,
      isLoading,
      accessToken,
      refreshToken,
      subscription,
      needsSubscription,
      isCheckingSubscription,
      login,
      logout,
      completeWelcome,
      refreshAccessToken,
      checkSubscription,
      handleSubscriptionComplete,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

console.log('[AuthContext Module] Loaded successfully', {
  AuthProvider: !!AuthProvider,
  useAuth: !!useAuth,
});
