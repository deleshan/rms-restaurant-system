import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { 
  addNewOrder, 
  updateOrderStatusSuccess, 
  setConnectionStatus 
} from '@/features/orders/orderSlice';
import { updateItemStatus } from '@/features/inventory/inventorySlice'; 
import { selectAudioAlertsEnabled } from '@/features/settings/settingsSelectors'; 

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Initialize outside to maintain singleton
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 10, 
  reconnectionDelay: 2000,
});

export const useSocket = (restaurantId) => {
  const dispatch = useDispatch();
  const audioEnabled = useSelector(selectAudioAlertsEnabled);
  const { token } = useSelector((state) => state.auth); 

  const playNotification = useCallback(() => {
    if (!audioEnabled) return; 
    const audio = new Audio('/sounds/new-order.mp3');
    audio.play().catch(err => console.log("Audio blocked:", err));
  }, [audioEnabled]);

  useEffect(() => {
    if (!restaurantId || !token) return;

    // Pass token in auth object for server-side validation
    socket.auth = { token };
    socket.connect();
    
    socket.on('connect', () => {
      dispatch(setConnectionStatus(true));
      socket.emit('join-kitchen-room', restaurantId);
    });

    socket.on('disconnect', () => {
      dispatch(setConnectionStatus(false));
    });

    // Listen for NEW_ORDER
    socket.on('NEW_ORDER', (newOrder) => {
      dispatch(addNewOrder(newOrder));
      playNotification();
    });

    // Listen for ORDER_STATUS_UPDATED
    socket.on('ORDER_STATUS_UPDATED', (data) => {
      dispatch(updateOrderStatusSuccess(data));
    });

    // Listen for INVENTORY_UPDATED (86-List)
    socket.on('INVENTORY_UPDATED', (data) => {
      // data: { itemId, isAvailable, stock }
      dispatch(updateItemStatus(data));
    });

    socket.on('connect_error', (err) => {
      console.error('Socket Error:', err.message);
      dispatch(setConnectionStatus(false));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('NEW_ORDER');
      socket.off('ORDER_STATUS_UPDATED');
      socket.off('INVENTORY_UPDATED');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [restaurantId, token, dispatch, playNotification]);

  const emitStatusUpdate = (orderId, status) => {
    socket.emit('update-order-status', { orderId, status, restaurantId });
  };

  return { emitStatusUpdate };
};