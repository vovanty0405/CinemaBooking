import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token?: string) => void;
  disconnect: () => void;
  joinShowtime: (showtimeId: string) => void;
  leaveShowtime: (showtimeId: string) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (token?: string) => {
    if (get().socket) return; // already connected

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    
    const newSocket = io(socketUrl, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  joinShowtime: (showtimeId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join_showtime', showtimeId);
    }
  },

  leaveShowtime: (showtimeId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave_showtime', showtimeId);
    }
  }
}));
