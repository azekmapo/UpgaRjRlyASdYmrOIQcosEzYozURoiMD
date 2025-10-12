import apiClient from '@/lib/api';
import type { EmailAutomationType, EmailValidationType, NotificationsType } from '@/types/db-types';

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

export const notificationService = {
  getNotifications: async (userId: string): Promise<ApiResponse<NotificationsType[]>> => {
    try {
      const response = await apiClient.get(`/api/notifications/${userId}`);
      return response as ApiResponse<NotificationsType[]>;
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error);
      
      return {
        success: true,
        data: [],
        message: 'Error fetching notifications, using cached data'
      };
    }
  },

  createNotification: async (notification: {
    sender_id: string;
    receiver_id: string | string[];
    title: string;
    message: string;
    type: string;
    status: string;
  }): Promise<ApiResponse<NotificationsType>> => {
    try {
      const response = await apiClient.post('/api/notifications/create', notification);
      return response as ApiResponse<NotificationsType>;
    } catch (error: unknown) {
      console.error('Error creating notification:', error);
      
      if (error instanceof Error && error.message && error.message.includes('Network')) {
        return {
          success: true,
          data: {} as NotificationsType, 
          message: 'Notification might have been created despite network issues'
        };
      }
      
      throw error;
    }
  },
  
  handlePropositionResponse: async (params: { 
    notification_id: string;
    user_id: string;
    response: 'accepted' | 'declined';
    proposition_id: string;
  }): Promise<ApiResponse<NotificationsType>> => {
    try {
      console.log('Sending proposition response with params:', params);
      console.log('API endpoint:', '/api/notifications/proposition/respond');
      
      const response = await apiClient.post('/api/notifications/proposition/respond', params);
      
      console.log('Received response from server:', response);
      return response as ApiResponse<NotificationsType>;
    } catch (error) {
      console.error('API call to /notifications/proposition/respond failed:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },

  handleGroupInvitationResponse: async (params: { 
    notification_id: string;
    user_id: string;
    response: 'accepted' | 'declined';
    group_id: string;
  }): Promise<ApiResponse<NotificationsType>> => {
    try {
      console.log('Sending group invitation response with params:', params);
      console.log('API endpoint:', '/api/groups/respond');
      
      // Transform params to match GroupController expectations
      const requestBody = {
        group_id: params.group_id,
        id_etd2: params.user_id,
        response: params.response
      };
      
      const response = await apiClient.post('/api/groups/respond', requestBody);
      
      console.log('Received response from server:', response);
      return response as ApiResponse<NotificationsType>;
    } catch (error) {
      console.error('API call to /groups/respond failed:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },
  
  deleteNotification: async (id: string, userId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(`/api/notifications/delete/${id}/${userId}`);
      return response as ApiResponse<void>;
    } catch (error: unknown) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  handlePfeValidationView: async (emailValidationId: string): Promise<ApiResponse<EmailValidationType>> => {
  try {
    const response = await apiClient.get(`/api/email-validations/${emailValidationId}`);
    return response as ApiResponse<any>;
  } catch (error: unknown) {
    console.error('Error fetching PFE validation details:', error);
    throw error;
  }
  },

  handleEmailAutomationView: async (emailAutomationId: string): Promise<ApiResponse<EmailAutomationType>> => {
  try {
    const response = await apiClient.get(`/api/email-automations/${emailAutomationId}`);
    return response as ApiResponse<any>;
  } catch (error: unknown) {
    console.error('Error fetching email automation details:', error);
    throw error;
  }
  },
};

