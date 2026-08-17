const express = require('express');
const router = express.Router();
const multer = require('multer');

const { 
    fetchInventoryItems, 
    bulkUploadInventory, 
    downloadTemplate,
    logPurchaseCSV,
    getStockMovements,
    previewDeduction,
    searchFoodDatabase,
    lookupBarcode,
    importFromUSDA,
    importFromBarcode,
    confirmUSDAMatch,
    toggleAvailability,
    updateStock,
    updateInventoryItem,
    createInventoryItem
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

/**
 * DIRECTORY SETUP 
 * Ensures the 'uploads' folder exists so Multer doesn't crash
 */
const uploadDir = './uploads';
if (!require('fs').existsSync(uploadDir)) {
    require('fs').mkdirSync(uploadDir);
}

/**
 * MULTER CONFIGURATION 
 * Stores CSV files temporarily before parsing
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `import-${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB Limit
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename:    (req, file, cb) => cb(null, `purchase-${Date.now()}-${file.originalname}`)
  }),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});


// ROUTES 

// @route   GET /api/inventory/items
// @desc    Get paginated inventory with search
router.get('/items', protect, fetchInventoryItems);

router.patch('/:id/availability', protect, toggleAvailability);
router.patch('/:id/stock', protect, updateStock);

// @route   POST /api/inventory/bulk-upload
// @desc    Upload CSV and insert new items (Duplicates are skipped in Controller)
router.post('/bulk-upload', protect, memoryUpload.single('file'), bulkUploadInventory);
router.post('/confirm-usda-match', protect, confirmUSDAMatch);

router.get('/items/:id/movements', protect, getStockMovements);
router.post('/preview-deduction', protect, previewDeduction);

router.get('/food-search', protect, searchFoodDatabase);
router.get('/barcode/:barcode', protect, lookupBarcode);
router.post('/import-from-usda', protect, importFromUSDA);
router.post('/import-from-barcode', protect, importFromBarcode);
router.put('/items/:id', protect, updateInventoryItem);


// @route   GET /api/inventory/template
// @desc    Download the CSV template for the user
router.get('/template', downloadTemplate);
router.post('/log-purchase', protect, diskUpload.single('file'),   logPurchaseCSV);

module.exports = router;