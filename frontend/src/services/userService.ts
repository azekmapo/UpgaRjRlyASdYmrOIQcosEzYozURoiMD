import apiClient from '@/lib/api';
import type { User } from '@/types/auth';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const userService = {
  getUsers: async (role?: string): Promise<ApiResponse<User[]>> => {
    try {
      const params = new URLSearchParams();
      if (role && role !== 'all') params.append('role', role);

      params.append('_t', Date.now().toString());

      const response = await apiClient.get(`/api/notification-users?${params.toString()}`);
      return response as ApiResponse<User[]>;
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      
      return {
        success: true,
        data: [],
        message: 'Error fetching users, returning empty list'
      };
    }
  }
}; 