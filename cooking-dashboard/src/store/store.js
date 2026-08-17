import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import orderReducer from '../features/orders/orderSlice';
import inventoryReducer from '../features/inventory/inventorySlice';
import settingsReducer from '../features/settings/settingsSlice';
import notificationsReducer from '../features/notifications/notificationSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: orderReducer,
    inventory: inventoryReducer,
    settings: settingsReducer,
    notifications: notificationsReducer,
  },
 
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt'],
        ignoredPaths: ['orders.orders.createdAt'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

if (import.meta.env.MODE !== 'production') {
  window.store = store;
}

export default store;