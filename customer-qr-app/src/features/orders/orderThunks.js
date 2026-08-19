import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../utils/api';
import { socket } from '../../socket';

/**
 * @desc  Place a new order
 * Sends cart data to the backend and joins the customer's socket room
 */
export const placeOrder = createAsyncThunk(
  'order/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const data = await apiService.placeOrder(orderData);
      const placedOrder = data.order; 

      // Join customer's personal socket room
      if (orderData.customer?.phone) {
        const normalizedPhone = orderData.customer.phone.replace(/\D/g, '');
        socket.emit('join-customer-room', normalizedPhone);
      }

      // Notify the Kitchen and Admin that a new order arrived
      // We send the restaurantId so it only goes to the correct kitchen
      socket.emit('new-order-placed', {
        order: placedOrder,
        restaurantId: orderData.restaurantId 
      });

      return placedOrder;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * @desc  Fetch a single order by its ID
 * Used when customer refreshes the page and we need to restore state
 */
export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const data = await apiService.getOrderById(orderId);
      return data.order;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * @desc  Fetch both current and past orders for a customer
 */
export const fetchCustomerOrders = createAsyncThunk(
  'order/fetchCustomerOrders',
  async ({ phone, restaurantId }, { rejectWithValue }) => {
    try {
      const data = await apiService.getCustomerOrders(phone, restaurantId);

      return {
        current: data.current || null,
        past: data.past || [],
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * @desc  Fetch only the current active order
 * Useful for lightweight polling or specific refresh scenarios
 */
export const fetchCurrentOrder = createAsyncThunk(
  'order/fetchCurrentOrder',
  async ({ phone, restaurantId }, { rejectWithValue }) => {
    try {
      const data = await apiService.getCustomerOrders(phone, restaurantId);
      return data.current || null;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * @desc  Fetch only past/completed orders
 * Useful for the order history section independently
 */
export const fetchPastOrders = createAsyncThunk(
  'order/fetchPastOrders',
  async ({ phone, restaurantId }, { rejectWithValue }) => {
    try {
      const data = await apiService.getCustomerOrders(phone, restaurantId);
      return data.past || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);