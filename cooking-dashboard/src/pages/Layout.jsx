import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import KitchenNavbar from '../components/layout/KitchenNavbar';
import KitchenSidebar from '../components/layout/KitchenSidebar';
import InventoryDrawer from './InventoryDrawer';
import { useDispatch } from 'react-redux';
import { fetchSettings } from '@/features/settings/settingsThunks';
import { fetchOrderHistory } from '@/features/orders/orderThunks';

const Layout = () => {
  const dispatch = useDispatch()
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSettings());  
    dispatch(fetchOrderHistory({ page: 1, limit: 50 }));
  }, [dispatch]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-950 text-slate-200">
      {/* Global Navbar */}
      <KitchenNavbar onOpenInventory={() => setIsInventoryOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <KitchenSidebar />

        {/* Main Content Area (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar relative">
          {/* The Outlet renders whatever page matches the current URL */}
          <Outlet />
        </main>
      </div>

      {/* Global Inventory Overlay (Drawer) */}
      <InventoryDrawer 
        isOpen={isInventoryOpen} 
        onClose={() => setIsInventoryOpen(false)} 
      />

      {/* Global Notification System (Optional) */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {/* Toast components would go here */}
      </div>
    </div>
  );
};

export default Layout;