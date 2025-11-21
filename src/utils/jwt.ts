import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  session_id: string;
  user_id: number;
  phone: string;
  role: string;
  subscription_status?: string;
  subscription_expiry_date?: string;
  iss: string;
  sub: string;
  exp: number;
  nbf: number;
  iat: number;
}

/**
 * Decode JWT token
 */
export const decodeJWT = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if free trial is still active
 */
export const checkFreeTrialStatus = (token: string): {
  hasFreeTrial: boolean;
  isExpired: boolean;
  expiryDate: Date | null;
  daysRemaining: number;
} => {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.subscription_expiry_date) {
    return {
      hasFreeTrial: false,
      isExpired: true,
      expiryDate: null,
      daysRemaining: 0,
    };
  }

  const expiryDate = new Date(payload.subscription_expiry_date);
  const now = new Date();
  const isExpired = expiryDate <= now;
  
  // Calculate days remaining
  const timeDiff = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

  return {
    hasFreeTrial: true,
    isExpired,
    expiryDate,
    daysRemaining,
  };
};

/**
 * Format remaining time for display
 */
export const formatRemainingTime = (daysRemaining: number): string => {
  if (daysRemaining === 0) {
    return 'Less than 1 day';
  } else if (daysRemaining === 1) {
    return '1 day';
  } else {
    return `${daysRemaining} days`;
  }
};

/**
 * Calculate precise remaining time (days, hours, minutes) from expiry date string
 */
export const calculateTimeRemaining = (expiryDateString: string): {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
} => {
  const expiryDate = new Date(expiryDateString);
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, totalMs: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, totalMs: diff };
};
