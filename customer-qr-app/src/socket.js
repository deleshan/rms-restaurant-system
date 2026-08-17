import { io } from 'socket.io-client';

const URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';

export const socket = io(URL, {
  autoConnect: false,     
  transports: ['websocket'], 
});


export const connectCustomerSocket = (phone) => {
  const normalized = phone.replace(/\D/g, '');

  if (!socket.connected) {
    socket.connect();
  }

  socket.off('connect'); 
  socket.on('connect', () => {
    socket.emit('join', normalized); 
    console.log(`Socket: Joined room customer_${normalized}`);
  });

  if (socket.connected) {
    socket.emit('join', normalized);
  }
};