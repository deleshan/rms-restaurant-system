import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import { socket } from './socket';

// Pages
import InitialForm from './pages/InitialForm';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import BillPage from './pages/BillPage';
import ReviewPage from './pages/ReviewPage';
import ProfilePage from './pages/ProfilePage';
import ThankYouPage from './pages/ThankYouPage';

// Components
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';

// Selectors & Actions
import { selectCustomer } from './features/auth/authSelectors';
import { markAsPaid, updateOrderStatus } from './features/orders/orderSlice';

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const customer = useSelector(selectCustomer);
  
  // Scoped to your specific order slice
  const isPaid = useSelector((state) => state.order.isPaid);

  const name  = customer?.name  || '';
  const phone = customer?.phone || '';

  const socketInitialized = useRef(false);

  // Global Redirect Logic 
  // Triggered when Redux state 'isPaid' becomes true
  useEffect(() => {
    if (isPaid) {
      navigate('/review');
    }
  }, [isPaid, navigate]);

  // Socket Setup & Listeners 
  useEffect(() => {
    if (!phone || socketInitialized.current) return;

    socketInitialized.current = true;

    // Ensure connection
    if (!socket.connected) {
      socket.connect();
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    
    /**
     * Join the customer-specific room. 
     * Matches backend: req.io.to(`customer_${normalizedPhone}`)
     */
    socket.emit('join', normalizedPhone);

    // Handler for manual 'Complete' triggers from Admin
    const handleOrderCompleted = () => {
      console.log('Socket: Order completed signal received');
      dispatch(markAsPaid());
    };

    /**
     * Main handler for live status changes.
     * data: { orderId, status, isPaid }
     */
    const handleStatusUpdate = (data) => {
      console.log('🔄 Socket: Status Update Received:', data);
      
      dispatch(updateOrderStatus(data));

      if (
        data.status === 'Completed' || 
        data.status === 'Served' || 
        data.isPaid === true
      ) {
        dispatch(markAsPaid());
      }
    };

    const handleConnectError = (err) => {
      console.error('Socket Connection Error:', err.message);
    };

    // Register Event Listeners
    socket.on('ORDER_COMPLETED', handleOrderCompleted);
    socket.on('status-update',   handleStatusUpdate);
    socket.on('connect_error',   handleConnectError);

    // Cleanup on unmount
    return () => {
      socket.off('ORDER_COMPLETED', handleOrderCompleted);
      socket.off('status-update',   handleStatusUpdate);
      socket.off('connect_error',   handleConnectError);
      socketInitialized.current = false;
    };
  }, [phone, dispatch]);

  // Route Guards 
  const ProtectedRoute = ({ children }) => {
    if (!name.trim() || !phone.trim()) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const PublicRoute = ({ children }) => {
    if (name.trim() && phone.trim()) {
      return <Navigate to="/menu" replace />;
    }
    return children;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - hidden on the entry page */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="*" element={<Header />} />
      </Routes>

      <main className="flex-1 pb-20">
        <Routes>
          {/* Entry Point */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <InitialForm />
              </PublicRoute>
            }
          />

          {/* Core App Flow */}
          <Route path="/menu"       element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
          <Route path="/cart"       element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/orders"     element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/bill"       element={<ProtectedRoute><BillPage /></ProtectedRoute>} />
          <Route path="/review"     element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
          <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/thank-you"  element={<ThankYouPage />} />

          {/* 404 Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent Navigation */}
      {name.trim() && phone.trim() && <BottomNavigation />}
    </div>
  );
};

export default App;