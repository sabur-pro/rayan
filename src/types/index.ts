// Re-export all types from different modules
export * from './api';
export * from './user';
export * from './ai';

// Common utility types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
