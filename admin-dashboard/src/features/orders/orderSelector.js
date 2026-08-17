import { createSelector } from '@reduxjs/toolkit';

//Base Selector 
export const selectOrdersState = (state) => state.orders || {};

// Primitive Selectors 

export const selectAllOrders = createSelector(
  [selectOrdersState],
  (orders) => orders.list || []
);

export const selectSelectedOrder = createSelector(
  [selectOrdersState],
  (orders) => orders.selectedOrder || null
);

export const selectOrdersLoading = createSelector(
  [selectOrdersState],
  (orders) => !!orders.loading
);

export const selectOrdersError = createSelector(
  [selectOrdersState],
  (orders) => orders.error || null
);

export const selectOrdersSuccessMessage = createSelector(
  [selectOrdersState],
  (orders) => orders.successMessage || null
);

export const selectOrdersTotalCount = createSelector(
  [selectOrdersState],
  (orders) => orders.totalCount || 0
);

export const selectOrdersCurrentPage = createSelector(
  [selectOrdersState],
  (orders) => orders.currentPage || 1
);

export const selectOrderStats = createSelector(
  [selectOrdersState],
  (orders) => orders.stats || {
    totalOrders:  0,
    pending:      0,
    preparing:    0,
    ready:        0,
    completed:    0,
    cancelled:    0,
    totalRevenue: 0,
  }
);

//Single Order Selectors 

/**
 * Select a single order by ID from the list
 */
export const selectOrderById = (orderId) =>
  createSelector(
    [selectAllOrders],
    (orders) => orders.find((o) => o._id === orderId) || null
  );

/**
 * Select the currently viewed order in OrderDetails
 */
export const selectCurrentOrderDetails = (orderId) =>
  createSelector(
    [selectSelectedOrder, selectAllOrders],
    (selectedOrder, orders) => {
      if (selectedOrder?._id === orderId) return selectedOrder;
      return orders.find((o) => o._id === orderId) || null;
    }
  );

//Status Filter Selectors 

export const selectPendingOrders = createSelector(
  [selectAllOrders],
  (orders) => orders.filter((o) => o.status === 'Pending')
);

export const selectPreparingOrders = createSelector(
  [selectAllOrders],
  (orders) => orders.filter((o) => o.status === 'Preparing')
);

export const selectReadyOrders = createSelector(
  [selectAllOrders],
  (orders) => orders.filter((o) => o.status === 'Ready')
);

export const selectActiveOrders = createSelector(
  [selectAllOrders],
  (orders) =>
    orders.filter((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status))
);

export const selectCompletedOrders = createSelector(
  [selectAllOrders],
  (orders) => orders.filter((o) => o.status === 'Completed')
);

export const selectCancelledOrders = createSelector(
  [selectAllOrders],
  (orders) => orders.filter((o) => o.status === 'Cancelled')
);

//AI & Insight Selectors 

/**
 * Enriches orders with computed AI insight flags
 * Used in OrderListPage for VIP / At-Risk badges
 */
export const selectOrdersWithInsights = createSelector(
  [selectAllOrders],
  (orders) =>
    orders.map((order) => ({
      ...order,
      isVip:                order.user?.segment === 'VIP',
      isAtRisk:             order.user?.segment === 'At-Risk',
      isLoyal:              order.user?.segment === 'Loyal',
      hasNegativeSentiment: order.sentiment === 'Negative',
      hasPositiveSentiment: order.sentiment === 'Positive',
    }))
);

export const selectVipOrders = createSelector(
  [selectAllOrders],
  (orders) => orders.filter((o) => o.user?.segment === 'VIP')
);

/**
 * Returns orders from at-risk customers
 * Useful for flagging churn risk in the dashboard
 */
export const selectAtRiskOrders = createSelector(
  [selectAllOrders],
  (orders) => orders.filter((o) => o.user?.segment === 'At-Risk')
);

//Financial Selectors 

//Total revenue from completed orders in the current list
export const selectTotalRevenue = createSelector(
  [selectCompletedOrders],
  (completed) =>
    completed.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
);

//Average order value across completed orders
export const selectAverageOrderValue = createSelector(
  [selectTotalRevenue, selectCompletedOrders],
  (total, completed) =>
    completed.length > 0
      ? parseFloat((total / completed.length).toFixed(2))
      : 0
);

//Total items sold across all completed orders
export const selectTotalItemsSold = createSelector(
  [selectCompletedOrders],
  (completed) =>
    completed.reduce(
      (sum, order) =>
        sum + (order.items?.reduce((s, item) => s + (item.qty || 0), 0) || 0),
      0
    )
);

//Search Selector 

/**
 * Filter orders by search term
 * Searches by order ID, customer name, phone, and table ID
 */
export const selectFilteredOrders = (searchTerm) =>
  createSelector([selectOrdersWithInsights], (orders) => {
    if (!searchTerm?.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o._id?.toLowerCase().includes(term) ||
        o.user?.name?.toLowerCase().includes(term) ||
        o.user?.phone?.toLowerCase().includes(term) ||
        o.tableId?.toLowerCase().includes(term)
    );
  });

//Combined Selectors 

/**
 * Combined selector for OrderListPage
 * Prevents multiple useSelector calls
 */
export const selectOrderListState = createSelector(
  [selectAllOrders, selectOrdersLoading, selectOrdersError, selectOrderStats, selectOrdersSuccessMessage],
  (orders, loading, error, stats, successMessage) => ({
    orders,
    loading,
    error,
    stats,
    successMessage,
  })
);

//Combined selector for OrderDetails page
export const selectOrderDetailsState = createSelector(
  [selectSelectedOrder, selectOrdersLoading, selectOrdersError],
  (order, loading, error) => ({
    order,
    loading,
    error,
  })
);

//Combined selector for Dashboard stats widget
export const selectDashboardOrderStats = createSelector(
  [selectOrderStats, selectTotalRevenue, selectAverageOrderValue, selectActiveOrders],
  (stats, totalRevenue, averageOrderValue, activeOrders) => ({
    ...stats,
    totalRevenue,
    averageOrderValue,
    activeOrderCount: activeOrders.length,
  })
);


export const orderSelectors = {
  selectAllOrders,
  selectSelectedOrder,
  selectOrdersLoading,
  selectOrdersError,
  selectOrderStats,
  selectOrderById,
  selectCurrentOrderDetails,
  selectPendingOrders,
  selectPreparingOrders,
  selectReadyOrders,
  selectActiveOrders,
  selectCompletedOrders,
  selectCancelledOrders,
  selectOrdersWithInsights,
  selectVipOrders,
  selectAtRiskOrders,
  selectTotalRevenue,
  selectAverageOrderValue,
  selectTotalItemsSold,
  selectFilteredOrders,
  selectOrderListState,
  selectOrderDetailsState,
  selectDashboardOrderStats,
};

export default orderSelectors;