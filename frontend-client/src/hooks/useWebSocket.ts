import { useEffect, useState } from 'react';
import { initializeWebSocket, disconnectWebSocket, subscribeToMessages, unsubscribeFromMessages } from '@/lib/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = initializeWebSocket(token);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      disconnectWebSocket();
    };
  }, []);

  return { isConnected };
}

export function useMessageSubscription(onMessage: (message: any) => void) {
  useEffect(() => {
    subscribeToMessages(onMessage);

    return () => {
      unsubscribeFromMessages();
    };
  }, [onMessage]);
}
