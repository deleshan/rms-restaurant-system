import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '@/services/api';

/**
 * Fetch Dashboard Statistics
 * This thunk calls Node.js backend, which should return:
 * 1. Traditional stats (Revenue, Orders)
 * 2. AI Sentiment results (from Python/VADER)
 * 3. Customer Segments (from Python/K-Means)
 */
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/dashboard-stats?t=${new Date().getTime()}`); 

      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue('Failed to fetch stats');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Server Error');
    }
  }
);

/**
 * Trigger AI Re-analysis 
 * Useful if want a button that forces the Python script to 
 * re-run the K-Means clustering or VADER sentiment analysis.
 */
export const triggerAIAnalysis = createAsyncThunk(
  'dashboard/triggerAI',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/trigger-ai-analysis');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'AI Analysis failed');
    }
  }
);

export const globalSearch = createAsyncThunk(
  'search/global',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/search', { params: { q: query } });
      return response.data.results;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Search failed');
    }
  }
);