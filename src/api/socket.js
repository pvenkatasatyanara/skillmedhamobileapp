import { io } from 'socket.io-client';
import { API_BASE_URL } from './config';

// Socket.IO connection to the assessment/proctoring server. In this deployment
// the socket shares the API host. Pure-JS, so it works in Expo Go too.
export function createSocket(token, { studentId } = {}) {
  const socket = io(API_BASE_URL, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    auth: token ? { token } : undefined,
    query: token ? { token } : undefined,
  });

  socket.on('connect', () => {
    if (studentId) socket.emit('newUser', { studentId });
  });

  return socket;
}

export default { createSocket };