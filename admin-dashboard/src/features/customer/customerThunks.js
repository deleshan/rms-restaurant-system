import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api'; 

/**
 * Helper to normalize API responses.
 */
const normalizeResponse = (response) => {
  const data = response.data;
  if (data && typeof data === 'object') {
    return {
      customers: data.customers || data.data || (Array.isArray(data) ? data : []),
      totalCount: data.totalCount || data.total || (Array.isArray(data) ? data.length : 0),
      page: data.page || 1,
      pageSize: data.pageSize || data.limit || 10
    };
  }
  return { customers: [], totalCount: 0, page: 1, pageSize: 10 };
};

// Fetch Paginated/Filtered Customers
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/customers', {
        params: {
          page: params.page || 1,
          limit: params.limit || 50,
          search: params.search || '',
          status: params.status !== 'all' ? params.status : undefined,
          sortBy: params.sortBy || 'createdAt',
          sortOrder: params.sortOrder || 'desc',
        },
      });
      return normalizeResponse(response);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Could not load customer database'
      );
    }
  }
);

// Fetch Single Customer by ID
export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/customers/${customerId}`);
      return response.data.customer || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Customer not found');
    }
  }
);

// Create New Customer
export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/customers', customerData);
      return response.data.customer || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create customer');
    }
  }
);

// Update Customer Profile
export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/customers/${id}`, updates);
      return response.data.customer || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update customer');
    }
  }
);

// Toggle Active/Blocked Status (The Block/Unblock button)
export const toggleCustomerStatus = createAsyncThunk(
  'customers/toggleStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/customers/${id}/status`, { isActive });
      return response.data.customer || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Status update failed');
    }
  }
);

// Update Loyalty Points
export const updateLoyaltyPoints = createAsyncThunk(
  'customers/updateLoyalty',
  async ({ id, pointsAction, amount }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/customers/${id}/loyalty`, { pointsAction, amount });
      return response.data.customer || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update points');
    }
  }
);

// Delete Customer Record
export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (customerId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/customers/${customerId}`);
      return customerId; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Delete operation failed');
    }
  }
);

export const triggerSegmentation = createAsyncThunk(
  'customers/triggerSegmentation',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/trigger-segmentation'); 
      return response.data; 
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "AI Service failed"
      );
    }
  }
);