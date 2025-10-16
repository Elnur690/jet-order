import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  orderId?: string;
  userId: string;
  createdAt: Date;
}

export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Listen for notifications
    newSocket.on('notification', (notification: Notification) => {
      // Only add notification if it's for the current user
      if (user && notification.userId === user.id) {
        setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
      }
    });

    // Listen for order updates (for real-time tracking)
    newSocket.on('orderUpdate', (data: any) => {
      console.log('Order updated:', data);
      // This event can be used by components to refresh order data
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { 
    socket, 
    connected, 
    notifications, 
    clearNotification, 
    clearAllNotifications 
  };
};