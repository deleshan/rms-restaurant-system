import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';


// Layout & Pages
import Layout from './pages/Layout';
import Login from './pages/Login';
import LiveOrders from './pages/LiveOrders';
import OrderHistory from './pages/OrderHistory';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';

// Global Components & Socket Logic
import ToastContainer from '@/components/common/Toast';
import { connectSocket, disconnectSocket } from '@/socket';

// Selectors
import { 
  selectIsAuthenticated, 
  selectAuthToken 
} from './features/auth/authSelectors';
import { selectFontSize } from './features/settings/settingsSelectors';
import { selectRestaurantId } from './features/auth/authSelectors';

/**
 * A Wrapper component to protect kitchen routes.
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated); 
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const restaurantId = useSelector(selectRestaurantId);
  const token = useSelector(selectAuthToken);
  const fontSize = useSelector(selectFontSize);

  // Manage Socket Lifecycle
  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect to the kitchen server if authenticated
      connectSocket(token, restaurantId);
    } else {
      // Clean up connection on logout or unauthorized access
      disconnectSocket();
    }

    // Cleanup on component unmount
    return () => disconnectSocket();
  }, [isAuthenticated, token, restaurantId]);

  // Accessibility: Map settings to global body classes
  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[fontSize] || 'text-base';

  return (
    <div className={`min-h-screen bg-slate-950 ${fontSizeClass} antialiased selection:bg-orange-500/30 text-slate-200`}>
      {/* ToastContainer remains at root to catch all notifications */}
      <ToastContainer />
      
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Kitchen Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard Entry Point */}
            <Route index element={<Navigate to="/live-orders" replace />} />
            
            <Route path="live-orders" element={<LiveOrders />} />
            <Route path="history" element={<OrderHistory />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;