import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice';
import CustomizationModal from './CustomizationModal';

const MenuItemCard = ({ item }) => {
  const dispatch = useDispatch();
  const [showAIModal, setShowAIModal] = useState(false);

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: item._id,
        name: item.name,
        price: item.price,
        qty: 1,
        customizations: [],
      })
    );
  };

  const handleAISubmit = (customizationData) => {
    dispatch(
      addToCart({
        id: item._id,
        name: item.name,
        price: item.price,
        qty: 1,
        customizations: customizationData,
      })
    );
    setShowAIModal(false);
  };

  return (
    <>
      {/* Card Container: Glassmorphic base with soft borders and diffused shadow */}
      <div className="group bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/40 overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] transition-all duration-500">
        
        {/* Item Image Section */}
        <div className="h-48 relative overflow-hidden">
          <img
            src={item.image || 'https://via.placeholder.com/400x300?text=Delicious+Food'}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Status Badges: Frosted Glass tags */}
          <div className="absolute top-4 left-4 flex gap-2">
            {item.isVegetarian && (
              <span className="bg-emerald-500/20 backdrop-blur-lg text-emerald-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/40 shadow-sm">
                Veg
              </span>
            )}
            {item.isSpicy && (
              <span className="bg-rose-500/20 backdrop-blur-lg text-rose-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/40 shadow-sm">
                Spicy
              </span>
            )}
          </div>
        </div>

        {/* Item Details Section */}
        <div className="p-6">
          <div className="mb-3">
            <h3 className="text-xl font-black text-slate-900 leading-tight uppercase italic tracking-tighter">
              {item.name}
            </h3>
            <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed line-clamp-2 min-h-[32px]">
              {item.description || 'Crafted with premium ingredients for an exceptional taste experience.'}
            </p>
          </div>

          <div className="flex items-end justify-between mt-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Price</span>
              <span className="text-2xl font-black text-slate-900 tracking-tighter italic">
                <span className="text-sm text-brand mr-1 font-bold not-italic font-sans">Rs.</span>
                {item.price}
              </span>
            </div>

            <div className="flex gap-3">
              {/* AI Customize Button: Subtle Frosted Look */}
              <button
                onClick={() => setShowAIModal(true)}
                className="relative p-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-white shadow-sm hover:bg-white transition-all duration-300 group/btn"
                title="Customize with AI"
              >
                <svg className="w-5 h-5 text-brand transition-transform duration-300 group-hover/btn:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {/* Visual indicator for "AI" feature */}
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                </span>
              </button>

              {/* Standard Add Button: Solid Neo-Glass Contrast */}
              <button
                onClick={handleAddToCart}
                className="bg-brand hover:bg-white hover:text-brand text-white font-black text-xs px-6 py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95 uppercase tracking-widest border-t border-white/30"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Customization Modal */}
      {showAIModal && (
        <CustomizationModal
          item={item}
          onClose={() => setShowAIModal(false)}
          onConfirm={handleAISubmit}
        />
      )}
    </>
  );
};

export default MenuItemCard;