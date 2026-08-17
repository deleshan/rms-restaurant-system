import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';

/**
 * Initialize the socket connection
 * We use 'websocket' transport for better performance and stability
 */
export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/**
 * Helper to join a specific restaurant's kitchen/admin room
 * @param {string} restaurantId 
 */
export const joinKitchenRoom = (restaurantId) => {
  if (restaurantId) {
    socket.emit('join-kitchen-room', restaurantId);
    console.log(`[Socket] Requested to join kitchen room: kitchen_${restaurantId}`);
  }
};

/**
 * Helper to update order status (if Admin changes status)
 * @param {Object} data { orderId, status, restaurantId, tableId }
 */
export const emitOrderStatusUpdate = (data) => {
  socket.emit('update-order-status', data);
};

// Log connection events for easier debugging
socket.on('connect', () => {
  console.log('[Socket] Connected to server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('[Socket] Connection Error:', error);
});

export default socket;