import { io } from 'socket.io-client';
import { store } from './store/store';
import { setConnectionStatus } from './features/orders/orderSlice';
import { socketNotificationReceived } from './features/notifications/notificationSlice'; 
import { fetchNotifications } from './features/notifications/notificationThunks';


const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';


console.log("Connecting to Socket at:", SOCKET_URL);
export const socket = io(SOCKET_URL, {
  autoConnect: false, 
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true,
});


socket.on('connect', () => {
  console.log('Kitchen Socket Connected:', socket.id);
  store.dispatch(setConnectionStatus(true));
});

socket.on('disconnect', (reason) => {
  console.log('Kitchen Socket Disconnected:', reason);
  store.dispatch(setConnectionStatus(false));
});

socket.on('connect_error', (error) => {
  console.error('Socket Connection Error:', error.message);
  store.dispatch(setConnectionStatus(false));
});


export const connectSocket = (token, restaurantId) => {
  if (!token) return;
  socket.auth = { token };
  
  socket.off('connect');
  socket.off('disconnect');
  socket.off('connect_error');
  socket.off('NEW_NOTIFICATION');

  socket.on('connect', () => {
    console.log('Kitchen Connected. Socket ID:', socket.id);
    store.dispatch(setConnectionStatus(true));
    
    if (restaurantId) {
      console.log(`Joining Kitchen Room: kitchen_${restaurantId}`);
      socket.emit('join-kitchen-room', restaurantId);

      store.dispatch(fetchNotifications());
    }
  });

  socket.on('disconnect', () => store.dispatch(setConnectionStatus(false)));
  socket.on('connect_error', () => store.dispatch(setConnectionStatus(false)));

  socket.on('NEW_NOTIFICATION', (notification) => {
    store.dispatch(socketNotificationReceived(notification));

    const alertSound = new Audio('/notification.mp3'); 
    alertSound.play().catch((err) => console.log('Audio playback failed:', err.name));
  });

  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.off('NEW_NOTIFICATION');
    socket.disconnect();
  }
};