//Select the entire dashboard state
export const selectDashboardState = (state) => state.dashboard;

// Select the stats object (Revenue, AI insights, etc.)
export const selectDashboardStats = (state) => state.dashboard.stats;

//Select the loading status for the main spinner
export const selectDashboardLoading = (state) => state.dashboard.loading;

//Select the error message for the ErrorMessage component
export const selectDashboardError = (state) => state.dashboard.error;

//Select only the AI Analyzing state 
export const selectAIAnalyzing = (state) => state.dashboard.aiAnalyzing;

//Derived Selector: Select specifically the Customer Segments for the Chart
export const selectCustomerSegments = (state) => state.dashboard.stats.segments;

// Select specifically for the Active Tables grid
export const selectActiveTables = (state) => state.dashboard.stats.activeTables;

// Select specifically for the Inventory Alert card
export const selectInventoryAlerts = (state) => state.dashboard.stats.inventoryAlerts;

// Derived Selector: Calculate overall sentiment percentage for a gauge
export const selectSentimentData = (state) => {
  const score = state.dashboard.stats.sentimentScore;
  let label = 'Neutral';
  if (score > 75) label = 'Very Positive';
  else if (score > 55) label = 'Positive';
  else if (score < 40) label = 'At Risk';

  return { score, label };
};