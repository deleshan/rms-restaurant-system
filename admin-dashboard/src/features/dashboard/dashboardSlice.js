import { createSlice } from '@reduxjs/toolkit';
import { fetchDashboardStats, triggerAIAnalysis } from './dashboardThunks';

const initialState = {
  stats: {
    todayRevenue: 0,
    activeOrders: 0,
    newCustomers: 0,
    avgRating: 0,
    sentimentScore: 0,
    sentimentLabel: 'Neutral',
    vipCount: 0,
    segments: {
      vips: 0,
      regulars: 0,
      atRisk: 0
    },
    activeTables: [], 
    inventoryAlerts: [],
    salesTrend: [],
    recentCustomizations: []
  },
  loading: false,
  error: null,
  aiAnalyzing: false, 
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDashboardStats 
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = { ...state.stats, ...action.payload,
          segments: {
          New: action.payload.segments?.New  ?? 0,
          vips: action.payload.segments?.vips ?? 0,
          regulars: action.payload.segments?.regulars ?? 0,
          atRisk: action.payload.segments?.atRisk ?? 0
        }
        };
        if (action.payload.segments) {
          state.stats.segments = {
            New: action.payload.segments?.New ?? 0,
            vips: action.payload.segments.vips ?? 0,
            regulars: action.payload.segments.regulars ?? 0,
            atRisk: action.payload.segments.atRisk ?? 0
          };
        }
        
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // triggerAIAnalysis (Optional)
      .addCase(triggerAIAnalysis.pending, (state) => {
        state.aiAnalyzing = true;
      })
      .addCase(triggerAIAnalysis.fulfilled, (state) => {
        state.aiAnalyzing = false;
      })
      .addCase(triggerAIAnalysis.rejected, (state, action) => {
        state.aiAnalyzing = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;