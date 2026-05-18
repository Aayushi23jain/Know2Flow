// Centralized socket.io configuration
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://know2flow-1.onrender.com';

export const createSocket = () => {
  return io(SOCKET_URL, { 
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });
};

export default SOCKET_URL;
