import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tableId: null,              
  name: '',
  phone: '',
  email: '',
  homeAddress: '',
  dateOfBirth: '',
  cart: [],                   
  currentOrderId: null,       
  orderStatus: null,         
};

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    // Set table ID when QR is scanned
    setTableId: (state, action) => {
      state.tableId = action.payload;
    },

    // Set customer details after initial form
    setCustomerDetails: (state, action) => {
      const { name, phone, email, homeAddress, dateOfBirth } = action.payload;
      state.name = name;
      state.phone = phone;
      state.email = email || '';
      state.homeAddress = homeAddress || '';
      state.dateOfBirth = dateOfBirth || '';
    },

    // Cart actions
    addToCart: (state, action) => {
      const item = action.payload; // { id, name, price, qty: 1, customizations: '' }
      const existingItem = state.cart.find(i => i.id === item.id && i.customizations === item.customizations);

      if (existingItem) {
        existingItem.qty += item.qty || 1;
      } else {
        state.cart.push({ ...item, qty: item.qty || 1 });
      }
    },

    updateItemQty: (state, action) => {
      const { itemId, qty, customizations = '' } = action.payload;
      const item = state.cart.find(i => i.id === itemId && i.customizations === customizations);
      if (item) {
        item.qty = qty;
        if (qty <= 0) {
          state.cart = state.cart.filter(i => !(i.id === itemId && i.customizations === customizations));
        }
      }
    },

    removeFromCart: (state, action) => {
      const { itemId, customizations = '' } = action.payload;
      state.cart = state.cart.filter(i => !(i.id === itemId && i.customizations === customizations));
    },

    clearCart: (state) => {
      state.cart = [];
    },

    // Order actions
    setCurrentOrder: (state, action) => {
      state.currentOrderId = action.payload.orderId;
      state.orderStatus = action.payload.status || 'Pending';
    },

    updateOrderStatus: (state, action) => {
      state.orderStatus = action.payload;
    },

    // Reset everything (new session)
    resetCustomer: () => initialState,
  },
});

export const {
  setTableId,
  setCustomerDetails,
  addToCart,
  updateItemQty,
  removeFromCart,
  clearCart,
  setCurrentOrder,
  updateOrderStatus,
  resetCustomer,
} = customerSlice.actions;

export default customerSlice.reducer;