// Re-export types for backward compatibility
export * from '../types/api';

// Import services
import { authService } from './authService';
import { userService } from './userService';
import { aiService } from './aiService';
import { subscriptionService } from './subscriptionService';

// Main API service that combines all services
class ApiService {
  // Auth methods
  signIn = authService.signIn.bind(authService);
  verify = authService.verify.bind(authService);
  refreshToken = authService.refreshToken.bind(authService);
  signOut = authService.signOut.bind(authService);

  // User methods
  getProfile = userService.getProfile.bind(userService);
  updateProfile = userService.updateProfile.bind(userService);
  deleteAccount = userService.deleteAccount.bind(userService);

  // AI methods
  sendMessage = aiService.sendMessage.bind(aiService);
  getConversations = aiService.getConversations.bind(aiService);
  getConversation = aiService.getConversation.bind(aiService);
  deleteConversation = aiService.deleteConversation.bind(aiService);

  // Subscription methods
  getCurrentSubscription = subscriptionService.getCurrentSubscription.bind(subscriptionService);
  createSubscription = subscriptionService.createSubscription.bind(subscriptionService);
  pollSubscriptionStatus = subscriptionService.pollSubscriptionStatus.bind(subscriptionService);
}

export const apiService = new ApiService();

// Also export individual services for direct access
export { authService, userService, aiService, subscriptionService };
