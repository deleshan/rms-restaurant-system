// Get the entire list of tables
export const selectAllTables = (state) => state.tables.items;

// Get the loading status (for showing spinners)
export const selectTablesLoading = (state) => state.tables.loading;

// Get any error messages from the backend
export const selectTablesError = (state) => state.tables.error;

// Get a specific table by its ID 
export const selectTableById = (state, tableId) => 
  state.tables.items.find((table) => table._id === tableId);

// Filter for only "Active" tables 
export const selectActiveTables = (state) => 
  state.tables.items.filter((table) => table.status === 'Active');

// Filter for "Occupied" tables 
export const selectOccupiedTables = (state) => 
  state.tables.items.filter((table) => table.status === 'Occupied');

// Get the total count of tables
export const selectTablesCount = (state) => state.tables.items.length;

// Get any success messages (for "Tables Created!" alerts)
export const selectTablesSuccessMessage = (state) => state.tables.successMessage;