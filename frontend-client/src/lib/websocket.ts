import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const initializeWebSocket = (token: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(WS_URL, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const subscribeToMessages = (callback: (message: any) => void) => {
  if (!socket) return;

  socket.on('newMessage', callback);
};

export const unsubscribeFromMessages = () => {
  if (!socket) return;

  socket.off('newMessage');
};
