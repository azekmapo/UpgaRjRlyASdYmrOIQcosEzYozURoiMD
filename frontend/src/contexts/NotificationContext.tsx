import type { NotificationsType } from '@/types/db-types';
import React, { createContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import io, { Socket } from 'socket.io-client';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { isEmailAutomationStatusUpdate, isEmailAutomationUpdate } from '@/functions/typeGuards';

interface NotificationContextType {
  notifications: NotificationsType[]; 
  fetchNotifications: () => Promise<void>;
  isLoading: boolean;
  removeNotification: (notificationId: string) => void;
  updateNotificationStatus: (notificationId: string, status: string) => void;
}

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  fetchNotifications: async () => {},
  isLoading: false,
  removeNotification: () => {},
  updateNotificationStatus: () => {},
});

// Export the context for use in the custom hook
export { NotificationContext };

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationsType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Remove a notification by ID
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);
  
  // Update a notification's status
  const updateNotificationStatus = useCallback((notificationId: string, status: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, status } 
          : n
      )
    );
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    // Wait a bit to ensure token is available in localStorage
    // This prevents race condition after login
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('[Notifications] Token not yet available, retrying in 100ms...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications(user.id);
      console.log('Fetched notifications:', response);
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error);
      
      // Check if it's a network error
      if (error instanceof Error && error.message && error.message.includes('Network')) {
        toast.error('Could not connect to notification service', { 
          description: 'Network connectivity issues detected'
        });
      } else {
        // Don't show toast for other errors to avoid spamming the user
        console.warn('Failed to load notifications, but will not interrupt user experience');
      }
      
      // Keep old notifications instead of clearing them
      // This prevents a jarring experience when there are connectivity issues
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) return;
    
    // Cleanup previous connection if exists
    if (socketRef.current) {
      console.log('Cleaning up previous socket connection');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Clear any pending reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    console.log(`Connecting to notification server at ${SOCKET_URL}`);
    
    try {
      const socketInstance = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        path: '/socket.io/',
        forceNew: true,
        autoConnect: true,
        withCredentials: false
      });
      
      socketInstance.io.on("error", (error) => {
        console.error("Socket.IO manager error:", error);
      });
      
      socketInstance.on('connect', () => {
        console.log('Connected to notification server with socket ID:', socketInstance.id);
        // Register user with the notification server
        socketInstance.emit('register', user.id);
        // Fetch notifications when connected
        fetchNotifications();
      });
      
      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        
        // Only show toast on first connection error
        if (!reconnectTimeoutRef.current) {
          toast.error(`Error connecting to notification server: ${error.message}`);
        }
        
        // Set up reconnection with exponential backoff
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect to notification server...');
            socketInstance.connect();
            reconnectTimeoutRef.current = null;
          }, 5000);
        }
      });

      // Listen for new notifications
      socketInstance.on('notification', (newNotification: NotificationsType) => {
        console.log('New notification received:', newNotification);
        
        // Handle special update events
        if (newNotification.type === 'CO_SUPERVISION_UPDATE') {
          console.log('Received co-supervision update:', newNotification);
          // Remove the pending notification for this proposition
          if (newNotification.proposition_id) {
            setNotifications(prev => 
              prev.filter(n => 
                !(n.proposition_id === newNotification.proposition_id && 
                  n.type === 'CO_SUPERVISION' && 
                  n.status === 'pending')
                )
            );
          }
          return; // Don't add this notification to the list or show a toast
        }

        if (isEmailAutomationUpdate(newNotification)) {
        window.dispatchEvent(new CustomEvent('emailAutomationUpdate', {
        detail: newNotification
        }));
        return; 
        }

        if (isEmailAutomationStatusUpdate(newNotification)) {
        window.dispatchEvent(new CustomEvent('emailAutomationStatusUpdate', {
        detail: newNotification
        }));
        return; 
        }

        // If it's an update to an existing notification (has status accepted/declined)
        if (newNotification.status === 'accepted' || newNotification.status === 'declined') {
          // Check if this is a response to a notification we sent
          if (newNotification.receiver_id === user.id) {
            // Update the status of the original notification
            if (newNotification.id) {
              updateNotificationStatus(newNotification.id, newNotification.status);
            }
          } else if (newNotification.sender_id === user.id) {
            // If we're the sender, remove the original notification that was responded to
            if (newNotification.proposition_id) {
              // Find and remove notifications related to this proposition
              setNotifications(prev => 
                prev.filter(n => 
                  !(n.proposition_id === newNotification.proposition_id && 
                    n.type === 'CO_SUPERVISION' && 
                    n.status === 'pending')
                )
              );
            }
          }
          
          // Add the response notification
          setNotifications(prev => [newNotification, ...prev]);
        } else {
          // Just a regular new notification
          setNotifications(prev => [newNotification, ...prev]);
        }
        
        // Show toast notification
        toast(newNotification.title || 'Nouvelle notification', {
          description: newNotification.message || newNotification.formatted_message || 'Vous avez reçu une nouvelle notification',
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => window.location.href = '/notifications'
          }
        });
      });
      
      socketRef.current = socketInstance;
    } catch (error) {
      console.error("Error initializing socket connection:", error);
      toast.error("Failed to initialize socket connection");
    }
    
    // Clean up on unmount or when user changes
    return () => {
      console.log('Cleaning up socket connection on unmount or user change');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (socketRef.current) {
        socketRef.current.off('notification');
        socketRef.current.off('connect_error');
        socketRef.current.off('connect');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, updateNotificationStatus, fetchNotifications]);
  
  // Fetch notifications on mount, when user changes, or when navigating to notifications page
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      fetchNotifications,
      isLoading,
      removeNotification,
      updateNotificationStatus
    }}>
      {children}
    </NotificationContext.Provider>
  );
};