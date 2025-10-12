import apiClient from '@/lib/api';
import type { GroupType, Etudiants, NotificationsType } from '@/types/db-types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const groupService = {
  hasGroup: async (userId: string): Promise<ApiResponse<boolean>> => {
    try {
      const response = await apiClient.get(`/api/groups/has-group/${userId}`);
      return response as ApiResponse<boolean>;
    } catch (error: unknown) {
      console.error('Error checking if user has a group:', error);
      return {
        success: false,
        data: false,
        message: 'Error checking group existence, assuming no group'
      };
    }
  },

  getUserGroupInfo: async (userId?: string): Promise<ApiResponse<{
    hasGroup: boolean;
    binomeName: string | null;
    group: GroupType | null;
    partnerId?: string;
  }>> => {
    try {
      const requestBody = userId ? { user_id: userId } : {};
      const response = await apiClient.post('/api/groups/user-info', requestBody);
      return response as ApiResponse<{
        hasGroup: boolean;
        binomeName: string | null;
        group: GroupType | null;
        partnerId?: string;
      }>;
    } catch (error: unknown) {
      console.error('Error fetching user group info:', error);
      throw error;
    }
  },

  getAvailableStudents: async (): Promise<ApiResponse<Etudiants[]>> => {
    try {
      const response = await apiClient.get('/api/groups/available-students');
      return response as ApiResponse<Etudiants[]>;
    } catch (error: unknown) {
      console.error('Error fetching available students:', error);
      throw error;
    }
  },

  getPendingInvitations: async (): Promise<ApiResponse<string[]>> => {
    try {
      const response = await apiClient.get('/api/groups/pending-invitations');
      return response as ApiResponse<string[]>;
    } catch (error: unknown) {
      console.error('Error fetching pending invitations:', error);
      return {
        success: false,
        data: [],
        message: 'Error fetching pending invitations'
      };
    }
  },

  createGroup: async (group: GroupType): Promise<ApiResponse<GroupType>> => {
    try {
      const response = await apiClient.post('/api/groups/create', group);
      return response as ApiResponse<GroupType>;
    } catch (error: unknown) {
      console.error('Error creating group:', error);
      
      if (error instanceof Error && error.message && error.message.includes('Network')) {
        return {
          success: true,
          data: {} as GroupType,
          message: 'Group might have been created despite network issues'
        };
      }
      
      throw error;
    }
  },
  
  handleGroupResponse: async (params: { 
    notification_id: string;
    response: 'accepted' | 'declined';
    user_id: string;
    group_id: string;
  }): Promise<ApiResponse<NotificationsType>> => {
    try {
      console.log('Sending group response with params:', params);
      console.log('API endpoint:', '/api/notifications/group/respond');

      const response = await apiClient.post('/api/notifications/group/respond', params);

      console.log('Received response from server:', response);
      return response as ApiResponse<NotificationsType>;
    } catch (error) {
      console.error('API call to /notifications/group/respond failed:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },

  sendGroupInvitation: async (id_etd2: string): Promise<ApiResponse<{ group_id: string; notification_id: string }>> => {
    try {
      const response = await apiClient.post('/api/groups/invite', { id_etd2 });
      return response as ApiResponse<{ group_id: string; notification_id: string }>;
    } catch (error: unknown) {
      console.error('Error sending group invitation:', error);
      throw error;
    }
  },
};

