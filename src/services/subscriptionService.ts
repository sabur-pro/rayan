import { BaseApiService } from './base';
import { Subscription, CreateSubscriptionRequest, SubscriptionError } from '../types/subscription';

class SubscriptionService extends BaseApiService {
  /**
   * Get current subscription status
   * @param withToken - Whether to include access tokens in response
   * @param accessToken - Optional access token for authenticated requests
   */
  async getCurrentSubscription(withToken: boolean = false, accessToken?: string): Promise<Subscription> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return this.makeRequest<Subscription>(
      `/user/subscription/current?with_token=${withToken}`,
      {
        method: 'GET',
        headers,
      }
    );
  }

  /**
   * Create a new subscription
   * @param data - Subscription data including proof photo
   * @param accessToken - Access token for authentication
   */
  async createSubscription(
    data: CreateSubscriptionRequest,
    accessToken: string
  ): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('end_date', data.end_date);
    formData.append('price', data.price.toString());
    formData.append('description', data.description);
    
    // Handle proof_photo based on platform
    if (data.proof_photo) {
      // For React Native, we need to create a proper file object
      const photoBlob = data.proof_photo as any;
      formData.append('proof_photo', photoBlob);
    }

    // For FormData, we need to explicitly remove Content-Type header
    // so that fetch can set it automatically with proper boundary
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
    };

    return this.makeRequest<{ message: string }>(
      '/user/subscription',
      {
        method: 'POST',
        headers,
        body: formData as any,
      },
      false,
      true // Skip default Content-Type header
    );
  }

  /**
   * Poll subscription status until it becomes active or timeout
   * @param accessToken - Access token for authentication
   * @param maxAttempts - Maximum number of polling attempts
   * @param intervalMs - Interval between attempts in milliseconds
   */
  async pollSubscriptionStatus(
    accessToken: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<{ status: 'active' | 'pending' | 'timeout'; subscription?: Subscription }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const subscription = await this.getCurrentSubscription(false, accessToken);
        
        if (subscription.status === 'active' && subscription.is_active) {
          return { status: 'active', subscription };
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error: any) {
        // If subscription not found, it's still pending
        if (error.status === 404) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
          continue;
        }
        throw error;
      }
    }
    
    return { status: 'timeout' };
  }
}

export const subscriptionService = new SubscriptionService();
