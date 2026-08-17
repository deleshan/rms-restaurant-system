import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchMenu } from '../features/menu/menuThunks';
import { setCategory } from '../features/menu/menuSlice';
import { selectMenuState } from '../features/menu/menuSelectors';
import { selectRestaurantId, selectTableId } from '../features/auth/authSelectors';
import BottomNavigation from '../components/BottomNavigation';
import MenuItemCard from '../components/MenuItemCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const MenuPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  // Get context from Redux (Auth Slice)
  const reduxRestaurantId = useSelector(selectRestaurantId);
  const tableId = useSelector(selectTableId);
  
  // Fallback to URL if Redux is empty (e.g., on direct link access)
  const urlRestaurantId = searchParams.get('rid') || searchParams.get('restaurantId');
  const restaurantId = reduxRestaurantId || urlRestaurantId;

  // Select Menu state
  const { 
    filteredItems, 
    categories, 
    currentCategory, 
    loading, 
    error 
  } = useSelector(selectMenuState);

  // Fetch menu on mount if restaurantId is present
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchMenu(restaurantId));
    }
  }, [dispatch, restaurantId]);

  const handleAddToCart = (item) => {
    // This will connect to your cartSlice later
    console.log('Added to cart:', item);
  };

  // Conditional Rendering for States 

  if (!restaurantId && !loading) {
    return (
      <ErrorMessage 
        message="No restaurant selected. Please scan the QR code again." 
        showRetry={false} 
      />
    );
  }

  if (loading) return <LoadingSpinner message="Loading delicious menu..." />;
  
  if (error) return (
    <ErrorMessage 
      message={error} 
      onRetry={() => dispatch(fetchMenu(restaurantId))}
    />
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        
        {/* Glassmorphic Header  */}
        <header className="mb-10 text-center relative">
          {/* Decorative Background Glow */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand/5 rounded-full blur-3xl -z-10" />
          
          {/* Table Badge */}
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Live at Table {tableId || 'Order'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">
            Explore <span className="text-brand">Menu</span>
          </h1>
        </header>

        {/*  Category Tabs (Horizontal Glass Track)  */}
        {categories.length > 0 && (
          <div className="sticky top-4 z-40 mb-10">
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-2 shadow-xl shadow-slate-200/50 flex overflow-x-auto space-x-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => dispatch(setCategory(cat))}
                  className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                    currentCategory === cat
                      ? 'bg-brand text-white shadow-lg shadow-brand/30 scale-105'
                      : 'text-slate-500 hover:bg-white hover:text-brand'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/*  Menu Items Grid  */}
        <div className="mt-4 px-2">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  onAddToCart={() => handleAddToCart(item)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[3rem]">
              <div className="text-5xl mb-4 grayscale opacity-50">🍱</div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                No items found in {currentCategory}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation fixed at base */}
      <BottomNavigation />
    </div>
  );
};

export default MenuPage;