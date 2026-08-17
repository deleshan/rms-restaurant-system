import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], 
  specialRequest: '',
  total: 0,
  itemCount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Add item to cart (with optional customization)
    addToCart: (state, action) => {
      const { id, name, price, qty = 1, customizations = '' } = action.payload;

      const existingItem = state.items.find(
        (item) =>
          item.id === id &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );

      if (existingItem) {
        existingItem.qty += qty;
      } else {
        state.items.push({ id, name, price, qty, customizations });
      }

      // Recalculate totals
      state.itemCount = state.items.reduce((sum, item) => sum + item.qty, 0);
      state.total = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    },

    // Update quantity of specific item
    updateItemQuantity: (state, action) => {
      const { id, customizations = [], qty } = action.payload;

      const item = state.items.find(
        (i) => i.id === id && JSON.stringify(i.customizations) === JSON.stringify(customizations)
      );

      if (item) {
        if (qty <= 0) {
          state.items = state.items.filter(
            (i) => !(i.id === id && JSON.stringify(i.customizations) === JSON.stringify(customizations))
          );
        } else {
          item.qty = qty;
        }

        // Recalculate totals
        state.itemCount = state.items.reduce((sum, i) => sum + i.qty, 0);
        state.total = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      }
    },

    // Remove specific item
    removeFromCart: (state, action) => {
      const { id, customizations = [] } = action.payload;

      state.items = state.items.filter(
        (i) => !(i.id === id && JSON.stringify(i.customizations) === JSON.stringify(customizations))
      );

      // Recalculate totals
      state.itemCount = state.items.reduce((sum, i) => sum + i.qty, 0);
      state.total = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    },

    // Set special request (e.g., "Serve with extra sauce")
    setSpecialRequest: (state, action) => {
      state.specialRequest = action.payload;
    },

    // Clear entire cart (after placing order)
    clearCart: (state) => {
      state.items = [];
      state.specialRequest = '';
      state.total = 0;
      state.itemCount = 0;
    },
    updateItemCustomizations: (state, action) => {
  const { id, oldCustomizations, newCustomizations } = action.payload;

  // Find the item based on ID and the OLD customizations
  const item = state.items.find(
    (i) =>
      i.id === id &&
      JSON.stringify(i.customizations) === JSON.stringify(oldCustomizations)
  );

  if (item) {
    item.customizations = newCustomizations;
 
    const duplicate = state.items.find(
      (i) =>
        i !== item && 
        i.id === id &&
        JSON.stringify(i.customizations) === JSON.stringify(newCustomizations)
    );

    if (duplicate) {
      duplicate.qty += item.qty;
      state.items = state.items.filter((i) => i !== item);
    }
  }

  state.itemCount = state.items.reduce((sum, i) => sum + i.qty, 0);
  state.total = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
},
  },
  
});

export const {
  addToCart,
  updateItemQuantity,
  removeFromCart,
  setSpecialRequest,
  updateItemCustomizations,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;