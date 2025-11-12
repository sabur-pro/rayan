export interface Subscription {
  id: number;
  price: number;
  start_date: string;
  end_date: string;
  proof_photo: string;
  status: 'pending' | 'active' | 'expired' | 'rejected';
  is_active: boolean;
  days_remaining: number;
  created_at: string;
  updated_at: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface CreateSubscriptionRequest {
  end_date: string;
  price: number;
  description: string;
  proof_photo: File | Blob;
}

export interface SubscriptionPlan {
  id: string;
  duration: number; // days
  price: number;
  title: string;
  description: string;
  features: string[];
}

export interface SubscriptionError {
  message: string;
}
