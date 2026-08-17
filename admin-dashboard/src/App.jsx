import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import store from './store/store';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme'; 

// Common Components
import LoadingSpinner from './components/common/LoadingSpinner';

// Layout components
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/TopBar';

// Socket and Thunks
import { socket, joinKitchenRoom } from './socket';
import { fetchOrders } from './features/orders/orderThunks';


import { ToastProvider } from './components/common/Toast';
import { fetchNotifications } from './features/notifications/notificationThunks';
import { socketNotificationReceived } from './features/notifications/notificationSlice';


// LAZY LOADED PAGES 
const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'));
const RegisterRestaurant = lazy(() => import('./pages/Register/RegisterRestaurant'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const OrderListPage = lazy(() => import('./pages/Orders/OrderListPage'));
const OrderDetails = lazy(() => import('./pages/Orders/OrederDetails'));
const MenuManagementPage = lazy(() => import('./pages/Menu/MenuManagementPage'));
const MenuItemDetailPage = lazy(() => import('./pages/Menu/MenuItemDetailPage')); 
const CustomerList = lazy(() => import('./pages/Customers/CustomerList'));
const CustomerDetailPage = lazy(() => import('./pages/Customers/CustomerDetailPage'));
const PromotionPage = lazy(() => import('./pages/Promotions/PromotionPage'));
const ReviewPage = lazy(() => import('./pages/Reviews/ReviewPage'));
const InventoryPage = lazy(() => import('./pages/Inventory/InventoryPage'));
const FinancePage = lazy(() => import('./pages/Finance/FinancePage'));
const FinanceOverview = lazy(() => import('./pages/Finance/FinanceOverview'));
const SalesReport = lazy(() => import('./pages/Finance/SalesReport'));
const PnLPage = lazy(() => import('./pages/Finance/PnLPage'));
const BalanceSheetPage = lazy(() => import('./pages/Finance/BalanceSheetPage'));
const CashFlowPage = lazy(() => import('./pages/Finance/CashFlowPage'));
const RestaurantProfile = lazy(() => import('./pages/Profile/RestaurantProfile'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));
const TableManagementPage = lazy(() => import('./pages/Table/TableManagementPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'));
const FinancialTransactionsPage = lazy(() => import('./pages/Finance/FinancialTransactionsPage'));
const PendingPaymentsPage = lazy(() => import('./pages/Finance/PendingPaymentsPage'))

// AUTH HELPERS 
const isAuthenticated = () => !!localStorage.getItem('token');

const ProtectedRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
};

// REAL-TIME LOGIC COMPONENT 
const SocketManager = () => {
  const dispatch = useDispatch();
  
    useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const restaurantId = user?.restaurantId || user?.id;

    if (isAuthenticated() && restaurantId) {
      joinKitchenRoom(restaurantId);
      dispatch(fetchNotifications());

      socket.on('NEW_ORDER_RECEIVED', (newOrder) => {
        dispatch(fetchOrders({ status: 'all' }));
        // sound removed from here - now lives in NEW_NOTIFICATION below
      });

      const NOTIFICATION_SOUNDS = {
        new_order: '/sounds/new-order.mp3',
        low_stock: '/sounds/alert.mp3',
        new_review: '/sounds/chime.mp3',
        system: '/sounds/notification.mp3',
      };

      socket.on('NEW_NOTIFICATION', (notification) => {
        dispatch(socketNotificationReceived(notification));

        const soundPath = NOTIFICATION_SOUNDS[notification.type] || NOTIFICATION_SOUNDS.system;
        const alertSound = new Audio(soundPath);
        alertSound.play().catch(() => console.log("Audio autoplay blocked"));
      });
    }

    return () => {
      socket.off('NEW_ORDER_RECEIVED');
      socket.off('NEW_NOTIFICATION');
    };
  }, [dispatch]);

  return null;
};

// MAIN LAYOUT 
const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { theme } = useTheme(); 
  const isDark = theme === 'dark';

  const user = JSON.parse(localStorage.getItem('user'));
  const restaurantId = user?.restaurantId || user?.id;

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden transition-colors duration-500",
      "bg-transparent",
      isDark ? "bg-dark-mesh" : "bg-glass-mesh"
    )}>
      {/* Sidebar - Fixed Height with padding */}
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Topbar - Floats at the top */}
        <Topbar
          toggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            <Suspense fallback={
              <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand animate-pulse">
                    Initializing Neural Interface...
                  </p>
                </div>
              </div>
            }>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Outlet context={{ restaurantId }} />
              </div>
            </Suspense>
          </div>
        </main>

        {/* Dynamic Background Decoration */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
};

function App() {
  const user = JSON.parse(localStorage.getItem('user'));
  const restaurantId = user?.restaurantId || user?.id;

  return (
    <Provider store={store}>
      <Router>
        <SocketManager />
        <ToastProvider />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <Routes>
            {/* Public Marketing/Auth Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register-restaurant" element={
              <PublicRoute>
                <RegisterRestaurant />
              </PublicRoute>
            } />

            {/* Private Admin Dashboard Area */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Orders */}
                <Route path="/orders" element={<OrderListPage />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                
                {/* Menu & Catalog */}
                <Route path="/menu" element={<MenuManagementPage />} />
                <Route path="/menu/:id" element={<MenuItemDetailPage />} />
                
                {/* CRM & Feedback */}
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
                <Route path="/promotions" element={<PromotionPage />} />
                <Route path="/reviews" element={<ReviewPage />} />
                
                {/* Operations */}
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/tables" element={<TableManagementPage restaurantId={restaurantId} />} />
                
                {/* Financial Suite */}
                <Route path="/finance" element={<FinancePage />}>
                   <Route index element={<FinanceOverview />} />
                   <Route path="sales" element={<SalesReport />} />
                   <Route path="pnl" element={<PnLPage />} />
                   <Route path="overview" element={<FinanceOverview />} />
                   <Route path="balance-sheet" element={<BalanceSheetPage />} />
                   <Route path="cash-flows" element={<CashFlowPage />} />
                   <Route path="transactions" element={<FinancialTransactionsPage />} />
                   <Route path="payables" element={<PendingPaymentsPage />} />
                </Route>

                {/* Account Settings */}
                <Route path="/profile" element={<RestaurantProfile />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* 404 Error Handler */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </Provider>
  );
}

export default App;