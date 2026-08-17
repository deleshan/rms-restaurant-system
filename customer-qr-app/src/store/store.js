import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import your feature reducers
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import orderReducer from '../features/orders/orderSlice';
import menuReducer from '../features/menu/menuSlice';
import profileReducer from '../features/profile/profileSlice';
import reviewReducer from '../features/review/reviewSlice';

// Combine all your reducers into one rootReducer
const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  order: orderReducer,
  menu: menuReducer,
  profile: profileReducer,
  review: reviewReducer,
});

// Setup the Persist Config
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth', 'cart', 'profile', 'order'], 
};

// Create the Persisted Reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the Store
export const store = configureStore({
  reducer: persistedReducer, 
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});


export const persistor = persistStore(store);

export default store;
