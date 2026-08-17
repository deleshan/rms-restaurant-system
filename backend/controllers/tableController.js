const Table = require('../models/Table');

/**
 * @desc    Get all tables for a specific restaurant
 * @route   GET /api/tables/:restaurantId
 * @access  Private (Admin)
 */
const getTables = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tables = await Table.find({ restaurantId }).sort({ tableNumber: 1 });
    
    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Bulk Create Tables (e.g., Generate tables 1 to 20)
 * @route   POST /api/tables/bulk
 * @access  Private (Admin)
 */
const bulkCreateTables = async (req, res) => {
  try {
    const { restaurantId, startNumber, endNumber, capacity } = req.body;

    if (!restaurantId || !startNumber || !endNumber) {
      return res.status(400).json({ message: "Please provide restaurantId and range." });
    }

    const tablesToCreate = [];
    for (let i = parseInt(startNumber); i <= parseInt(endNumber); i++) {
      const formattedNumber = i.toString().padStart(2, '0');
      
      tablesToCreate.push({
        restaurantId,
        tableNumber: formattedNumber,
        capacity: capacity || 4,
        status: 'Active'
      });
    }

    const createdTables = await Table.insertMany(tablesToCreate, { ordered: false });

    res.status(201).json({
      success: true,
      message: `${createdTables.length} tables created successfully.`,
      data: createdTables
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(201).json({
        success: true,
        message: "Bulk operation partial success. Existing table numbers were skipped.",
        details: error.writeErrors?.length + " duplicates found."
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Table Status (The "Kill Switch" for QR codes)
 * @route   PATCH /api/tables/:id
 * @access  Private (Admin)
 */
const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, capacity } = req.body;

    const table = await Table.findByIdAndUpdate(
      id,
      { status, capacity },
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.status(200).json({
      success: true,
      message: `Table ${table.tableNumber} updated to ${table.status}`,
      data: table
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a table
 * @route   DELETE /api/tables/:id
 * @access  Private (Admin)
 */
const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    res.status(200).json({ success: true, message: "Table deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTables,
  bulkCreateTables,
  updateTableStatus,
  deleteTable
};