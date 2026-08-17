import { createSlice } from '@reduxjs/toolkit';
import { fetchMenu } from './menuThunks';

const initialState = {
  items: [],
  categories: ['All'],
  selectedCategory: 'All',
  loading: false,
  error: null,
  totalCount: 0,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearMenuError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading = false;
        
        const menuItems = action.payload?.items || [];
        const count = action.payload?.totalCount || 0;

        state.items = menuItems;
        state.totalCount = count;

        // Generate unique categories from the items list
        const uniqueCategories = [
          'All', 
          ...new Set(menuItems.map(item => item.category))
        ];
        
        state.categories = uniqueCategories;
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch menu';
      });
  },
});

// Selectors for easy access in components
export const selectMenuItems = (state) => {
  const { items, selectedCategory } = state.menu;
  if (selectedCategory === 'All') return items;
  return items.filter(item => item.category === selectedCategory);
};

export const { setCategory, clearMenuError } = menuSlice.actions;

export default menuSlice.reducer;