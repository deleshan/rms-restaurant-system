const express = require('express');
const router = express.Router();
const {
  getTables,
  bulkCreateTables,
  updateTableStatus,
  deleteTable
} = require('../controllers/tableController');

// All routes here are relative to /api/tables in your server.js

/**
 * GET /api/tables/:restaurantId
 * Fetch all tables for a specific restaurant
 */
router.get('/:restaurantId', getTables);

/**
 * POST /api/tables/bulk
 * Create multiple tables at once (Initial Setup)
 */
router.post('/bulk', bulkCreateTables);

/**
 * PATCH /api/tables/:id
 * Update status (Active/Inactive) or capacity of a specific table
 */
router.patch('/:id', updateTableStatus);

/**
 * DELETE /api/tables/:id
 * Remove a table from the system
 */
router.delete('/:id', deleteTable);

module.exports = router;