import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Feature Reducers
import authReducer from '../features/auth/authSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import ordersReducer from '../features/orders/orderSlice';
import menuReducer from '../features/menu/menuSlice';
import customersReducer from '../features/customer/customerSlice';
import promotionsReducer from '../features/promotions/promotionSlice';
import reviewsReducer from '../features/reviews/reviewSlice';
import inventoryReducer from '../features/inventory/inventorySlice';
import financeReducer from '../features/finance/financeSlice';
import settingsReducer from '../features/settings/settingsSlice';
import tableReducer from '../features/table/tableSlice';
import registerReducer from '../features/registration/registerSlice';
import notificationsReducer from '../features/notifications/notificationSlice';
import payablesReducer from '../features/finance/payablesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    orders: ordersReducer,
    menu: menuReducer,
    customers: customersReducer,
    promotions: promotionsReducer,
    reviews: reviewsReducer,
    inventory: inventoryReducer,
    finance: financeReducer,
    settings: settingsReducer,
    tables: tableReducer,
    registration: registerReducer,
    notifications: notificationsReducer,
    payables: payablesReducer
    
    // [apiService.reducerPath]: apiService.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setLoginTime'], 
        ignoredPaths: ['finance.selectedDate'],
      },
    }).concat(),
  devTools: import.meta.env.MODE !== 'production', 
});

export default store;