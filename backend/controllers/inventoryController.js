const Inventory = require('../models/Inventory');
const csv = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const StockMovement = require('../models/StockMovement');
const MenuItem = require('../models/MenuItem');
const { searchUSDA, getUSDAFoodById, lookupBarcode, extractNutrients, mapUSDACategory } = require('../utils/foodDatabaseService');
const stringSimilarity = require('string-similarity');
const { resolveIngredients } = require('../utils/inventory.util');
const { recalculateAvailabilityForInventoryItem, recalculateMenuItemAvailability } = require('../utils/menuAvailability.util');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const parseNumericField = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace(/[,\sRs.]/g, ''); 
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
};

const roundTo = (val, decimals = 2) => {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const factor = 10 ** decimals;
  return Math.round((Number(val) + Number.EPSILON) * factor) / factor;
};



/**
 * @desc    Get Paginated Inventory with Summary Stats
 * @route   GET /api/inventory/items
 */
exports.fetchInventoryItems = async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '', category } = req.query;
    const restaurantId = req.user.restaurantId;

    const query = { restaurantId };
    
    // Search logic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const items = await Inventory.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Inventory.countDocuments(query);
    const allItems = await Inventory.find({ restaurantId });
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const summary = {
      lowStockCount: allItems.filter(i => i.currentStock > 0 && i.currentStock <= i.minimumStock).length,
      outOfStockCount: allItems.filter(i => i.currentStock <= 0).length,
      totalStockValue: allItems.reduce((acc, i) => acc + (i.currentStock * (i.costPerUnit || 0)), 0),
      
      expiringSoonCount: allItems.filter(i => 
        i.expiryDate && 
        new Date(i.expiryDate) <= thirtyDaysFromNow && 
        new Date(i.expiryDate) > now
      ).length
    };

    const cleanedItems = items.map(item => {
      const obj = item.toObject();
      obj.currentStock = roundTo(obj.currentStock, 2);
      obj.costPerUnit = roundTo(obj.costPerUnit, 2);
      obj.minimumStock = roundTo(obj.minimumStock, 2);
      if (Array.isArray(obj.batches)) {
        obj.batches = obj.batches.map(b => ({
          ...b,
          quantity: roundTo(b.quantity, 2),
          costPerBatchUnit: roundTo(b.costPerBatchUnit, 4),
        }));
      }
      return obj;
    });

    res.status(200).json({
      items: cleanedItems,
      totalCount: total,
      page: Number(page),
      summary
    });
  } catch (error) {
    console.error('Fetch Inventory Error:', error);
    res.status(500).json({ message: 'Server error fetching inventory' });
  }
};

/**
 * @desc    Bulk Upload Inventory via CSV with Duplicate Protection
 * @route   POST /api/inventory/bulk-upload
 */
exports.bulkUploadInventory = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const isInitialSetup = req.body.isInitialSetup === 'true' || req.body.isInitialSetup === true;
    const fileBuffer = req.file.buffer;
    const rows = csv.parse(fileBuffer, { columns: true, skip_empty_lines: true });

    const cleanRows = rows
      .map(rawRow => Object.fromEntries(
        Object.entries(rawRow).map(([k, v]) => [k.trim(), typeof v === 'string' ? v.trim() : v])
      ))
      .filter(row => row.name && row.name.trim());

    // Run USDA lookups concurrently (batches of 5) instead of one row at a time
    const CONCURRENCY = 5;
    const results = [];
    for (let i = 0; i < cleanRows.length; i += CONCURRENCY) {
      const batch = cleanRows.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (row) => {
          const usdaResults = await searchUSDA(row.name.trim());
          return { row, usdaResults };
        })
      );
      results.push(...batchResults);
    }

    // Build autoImported / needsReview directly from the parallel results -
    // this replaces the old sequential loop entirely, no re-fetching from USDA.
    const autoImported = [];
    const needsReview = [];

    for (const { row, usdaResults } of results) {
      if (!usdaResults || !usdaResults.length) {
        needsReview.push({ csvRow: row, suggestions: [] });
        continue;
      }
      const validResults = usdaResults.filter(f => f.description && typeof f.description === 'string');
      if (!validResults.length) {
        needsReview.push({ csvRow: row, suggestions: [] });
        continue;
      }
      const descriptions = validResults.map(f => f.description.toLowerCase());
      const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(
        row.name.toLowerCase().trim(),
        descriptions
      );
      if (bestMatch.rating >= 0.6) {
        const matched = validResults[bestMatchIndex];
        autoImported.push({
          ...row,
          sku: `USDA-${matched.fdcId}`,
          restaurantId,
          nutrients: extractNutrients(matched),
          usdaFdcId: matched.fdcId,
          category: mapUSDACategory(matched.foodCategory || '') || row.category || 'Other',
          currentStock: parseFloat(row.currentStock) || 0,
          minimumStock: parseFloat(row.minimumStock) || 5,
          costPerUnit: parseNumericField(row.costPerUnit || row.unitPrice) || 0,
          unit: (row.unit || 'pcs').trim(),
        });
      } else {
        needsReview.push({
          csvRow: row,
          suggestions: validResults.slice(0, 3).map(f => ({
            fdcId: f.fdcId,
            description: f.description,
            category: f.foodCategory || 'Other',
            score: stringSimilarity.compareTwoStrings(
              row.name.toLowerCase().trim(),
              f.description.toLowerCase()
            ),
            nutrients: extractNutrients(f),
          }))
        });
      }
    }

    if (autoImported.length) {
      const existingItems = await Inventory.find({ restaurantId }, { name: 1, sku: 1 }).lean();
      const existingNames = new Set(existingItems.map(i => i.name.toLowerCase().trim()));
      const existingSkus = new Set(existingItems.map(i => i.sku).filter(Boolean));

      let newItems = autoImported.filter(item =>
        !existingNames.has(item.name.toLowerCase().trim()) &&
        !existingSkus.has(item.sku)
      );

      const skippedItems = autoImported
        .filter(item =>
          existingNames.has(item.name.toLowerCase().trim()) ||
          existingSkus.has(item.sku)
        )
        .map(item => item.name);
      const skippedCount = skippedItems.length;

      // dedupe within the batch itself (two identical names in the same CSV
      const seenNames = new Set();
      const seenSkus = new Set();
      newItems = newItems.filter(item => {
        const nameKey = item.name.toLowerCase().trim();
        if (seenNames.has(nameKey)) return false;
        if (item.sku && seenSkus.has(item.sku)) return false;
        seenNames.add(nameKey);
        if (item.sku) seenSkus.add(item.sku);
        return true;
      });

      try {
        if (newItems.length) {
          await Inventory.insertMany(newItems, { ordered: false });
        }
      } catch (insertErr) {
        const isDuplicateKeyError =
          insertErr.code === 11000 ||
          insertErr.writeErrors?.some(e => e.code === 11000 || e.err?.code === 11000) ||
          /duplicate key/i.test(insertErr.message || '');

        if (!isDuplicateKeyError) throw insertErr;
        console.warn('Some duplicates slipped through:', insertErr.message);
      }

      let openingValueAdded = 0;
      let ledgerWarning = null;

      if (isInitialSetup && newItems.length) {
        openingValueAdded = newItems.reduce(
          (sum, i) => sum + ((Number(i.currentStock) || 0) * (Number(i.costPerUnit) || 0)), 0
        );
        if (openingValueAdded > 0) {
          try {
            const Transaction = require('../models/Transaction');
            await Transaction.create({
              restaurant: restaurantId,
              user: req.user.id,
              type: 'ADJUSTMENT',
              category: 'OPENING_STOCK',
              amount: openingValueAdded,
              paymentMethod: 'MULTIPLE',
              description: `Opening stock (bulk import) — ${newItems.length} item(s)`,
              isSystemGenerated: true,
              status: 'COMPLETED',
              date: new Date(),
              details: { inventoryValue: openingValueAdded, isInitialSetup: true, referenceNumber: `INV-INIT-${Date.now()}` },
            });
          } catch (txnErr) {
            // Items above are already committed via insertMany — a ledger-logging
            // failure here must never turn a successful import into a 500.
            console.error('Opening stock Transaction logging failed (non-blocking):', txnErr.message);
            ledgerWarning = `Items were added (value: LKR ${openingValueAdded.toLocaleString()}), but the ledger entry failed to record: ${txnErr.message}. You may need to log this manually later.`;
          }
        }
      }

      return res.status(200).json({
        success: true,
        autoImported: newItems.length,
        skipped: skippedCount,
        skippedNames: skippedItems,
        needsReview,
        openingValueAdded,
        ledgerWarning,
        message: `${newItems.length} items imported. ${skippedCount} already exist. ${needsReview.length} need review.`
      });
    }

    return res.status(200).json({
      success: true,
      autoImported: 0,
      skipped: 0,
      needsReview,
      openingValueAdded: 0,
      message: `0 items imported. ${needsReview.length} need review.`
    });
  } catch (err) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// New endpoint - user confirms a suggestion from the review step
exports.confirmUSDAMatch = async (req, res) => {
  try {
    const { csvRow, fdcId, nutrients, category, isInitialSetup } = req.body;
    const restaurantId = req.user.restaurantId;
    const sku = `USDA-${fdcId}`;

    const existing = await Inventory.findOne({
      restaurantId,
      $or: [
        { sku },
        { name: { $regex: new RegExp(`^${csvRow.name.trim()}$`, 'i') } }
      ]
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `"${csvRow.name}" already exists in your inventory`
      });
    }

    const item = await Inventory.create({
      ...csvRow,
      sku,
      restaurantId,
      nutrients,
      usdaFdcId:    fdcId,
      category:     category || csvRow.category || 'Other',
      currentStock: parseFloat(csvRow.currentStock) || 0,
      minimumStock: parseFloat(csvRow.minimumStock) || 5,
      costPerUnit:  parseFloat(csvRow.costPerUnit)  || 0,
      unit:         (csvRow.unit || 'pcs').trim(),  
    });

    let valueAdded = 0;
    let ledgerWarning = null;
    if (isInitialSetup) {
      valueAdded = (parseFloat(csvRow.currentStock) || 0) * (parseFloat(csvRow.costPerUnit) || 0);
      if (valueAdded > 0) {
        try {
          const Transaction = require('../models/Transaction');
          await Transaction.create({
            restaurant: restaurantId,
            user: req.user.id,
            type: 'ADJUSTMENT',
            category: 'OPENING_STOCK',
            amount: valueAdded,
            paymentMethod: 'MULTIPLE',
            description: `Opening stock: ${item.name}`,
            isSystemGenerated: true,
            status: 'COMPLETED',
            date: new Date(),
            details: { inventoryValue: valueAdded, isInitialSetup: true, referenceNumber: `INV-INIT-${Date.now()}` },
          });
        } catch (txnErr) {
          console.error('Opening stock Transaction logging failed (non-blocking):', txnErr.message);
          ledgerWarning = `Item added (value: LKR ${valueAdded.toLocaleString()}), but the ledger entry failed: ${txnErr.message}.`;
        }
      }
    }

    res.status(201).json({ success: true, item, valueAdded, ledgerWarning });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get Inventory CSV Template (Import or Purchase)
 * @route   GET /api/inventory/template?type=purchase
 */
exports.downloadTemplate = (req, res) => {
  const { type } = req.query;
  let csvContent;
  let filename;

  if (type === 'purchase') {
    csvContent = [
      'name,sku,Quantity,unit,unitPrice,expiryDate',
      'Basmati Rice,RICE-001,50,kg,460,2026-12-31',
      'Tomato,VEG-05,10,kg,195,2026-04-15'
    ].join('\n');
    filename = 'purchase_restock_template.csv';
  } else {
    csvContent = [
      'name,category,unit,currentStock,minimumStock,costPerUnit,expiryDate',
      'Rice,Grains,kg,100,20,450,2026-12-31',
      'Chicken,Meat,kg,30,10,1200,2026-06-30'
    ].join('\n');
    filename = 'inventory_import_template.csv';
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csvContent);
};

/**
 * @desc    Bulk Update Stock (Log Purchases)
 *          If a row has no SKU, searches USDA by name and either matches an
 *          existing item, creates a brand-new item (USDA-matched or manual
 *          fallback), then logs the purchase batch against it either way.
 * @route   POST /api/inventory/log-purchase
 */
exports.logPurchaseCSV = async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const restaurantId = req.user.restaurantId;
    const userId = req.user.id;
    filePath = req.file.path;

    const { paymentStatus = 'Paid', supplier = 'Unknown Supplier', dueDate, paymentMethod = 'Cash' } = req.body;

    const fileContent = fs.readFileSync(filePath);
    const jsonArray = csv.parse(fileContent, { columns: true, skip_empty_lines: true });

    let updatedCount = 0;
    let newlyCreatedCount = 0;
    let failedSkus = [];
    let unitMismatches = [];
    let newItemsCreated = []; // { name, sku, matchedFromUSDA }
    let totalPurchaseCost = 0;

    for (const row of jsonArray) {
      const sku = (row.sku || row.SKU || '').trim();
      const itemName = (row.name || row.Name || '').trim();
      const rawQuantity = parseNumericField(row.Quantity || row.quantity || row.currentStock);
      const rawUnitPrice = parseNumericField(row.unitPrice || row.costPerUnit);
      const csvUnit = (row.unit || row.Unit || '').trim();
      const expiryDateStr = row.expiryDate || row.ExpiryDate;

      if (rawQuantity <= 0) continue; 

      if (rawUnitPrice <= 0) {
        failedSkus.push(`${sku || itemName || 'Unknown row'} (invalid or missing unit price)`);
        continue;
      }

      let item = null;

      if (sku) {
        // Explicit SKU given - this is a restock of a known item.
        // If it doesn't match, that's a real data error, not something to auto-create.
        item = await Inventory.findOne({ sku, restaurantId });
        if (!item) {
          failedSkus.push(`${sku} (no matching item found)`);
          continue;
        }
      } else {
        // No SKU provided - search USDA by name, same matching logic as Bulk Import
        if (!itemName) {
          failedSkus.push('Row skipped (missing both SKU and name)');
          continue;
        }

        // Check if an item with this exact name already exists for this restaurant
        item = await Inventory.findOne({
          restaurantId,
          name: { $regex: new RegExp(`^${itemName}$`, 'i') },
        });

        if (!item) {
          // Not in inventory yet - search USDA to auto-create it
          const usdaResults = await searchUSDA(itemName);
          const validResults = (usdaResults || []).filter(f => f.description && typeof f.description === 'string');

          let matched = null;
          if (validResults.length) {
            const descriptions = validResults.map(f => f.description.toLowerCase());
            const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(
              itemName.toLowerCase(), descriptions
            );
            if (bestMatch.rating >= 0.6) matched = validResults[bestMatchIndex];
          }

          const unitForNewItem = (csvUnit || 'pcs');

          if (matched) {
            item = await Inventory.create({
              restaurantId,
              name: itemName,
              sku: `USDA-${matched.fdcId}`,
              category: mapUSDACategory(matched.foodCategory || '') || 'Other',
              unit: unitForNewItem,
              nutrients: extractNutrients(matched),
              usdaFdcId: matched.fdcId,
              currentStock: 0,
              minimumStock: 5,
              costPerUnit: 0,
              batches: [],
            });
            newItemsCreated.push({ name: item.name, sku: item.sku, matchedFromUSDA: true });
          } else {
            // No USDA match either - create a manual fallback entry so the
            // purchase can still be logged, rather than silently dropping it
            const manualSku = `MANUAL-${itemName.replace(/\s+/g, '').toUpperCase().slice(0, 12)}-${Date.now().toString().slice(-5)}`;
            item = await Inventory.create({
              restaurantId,
              name: itemName,
              sku: manualSku,
              category: row.category || 'Other',
              unit: unitForNewItem,
              currentStock: 0,
              minimumStock: 5,
              costPerUnit: 0,
              batches: [],
            });
            newItemsCreated.push({ name: item.name, sku: item.sku, matchedFromUSDA: false });
          }
          newlyCreatedCount++;
        }
      }

      let quantity = rawQuantity;
      let unitPrice = rawUnitPrice;

      // Unit conversion only applies to items that already had stock/pricing history
      if (csvUnit && csvUnit.toLowerCase() !== item.unit.toLowerCase()) {
        try {
          quantity = convertQuantity(rawQuantity, csvUnit, item.unit);
          unitPrice = convertPricePerUnit(rawUnitPrice, csvUnit, item.unit);


          unitMismatches.push({
            sku: item.sku,
            name: item.name,
            csvUnit,
            itemUnit: item.unit,
            convertedQuantity: quantity.toFixed(2),
            convertedPrice: unitPrice.toFixed(4),
          });
        } catch (conversionErr) {
          failedSkus.push(`${item.sku} (unit mismatch: ${conversionErr.message})`);
          continue;
        }
      }

      const newBatch = {
        quantity,
        expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
        costPerBatchUnit: unitPrice,
        purchaseDate: new Date(),
      };

      item.batches.push(newBatch);
      item.costPerUnit = unitPrice;

      await item.save();
      await recalculateAvailabilityForInventoryItem(item._id, restaurantId, req.io);
      updatedCount++;
      totalPurchaseCost += quantity * unitPrice;
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (totalPurchaseCost > 0) {
      const Transaction = require('../models/Transaction');
      const isPending = paymentStatus === 'Unpaid';
      const paymentMethodMap = {
        'Cash': 'CASH', 'Bank_Transfer': 'BANK_TRANSFER',
        'Card': 'CARD', 'Cheque': 'BANK_TRANSFER', 'Other': 'CASH',
      };

      await Transaction.create({
        restaurant: restaurantId,
        user: userId,
        type: 'EXPENSE',
        category: 'PURCHASE',
        amount: totalPurchaseCost,
        paymentMethod: paymentMethodMap[paymentMethod] || 'CASH',
        description: `Bulk inventory restock — ${updatedCount} item(s)`,
        isSystemGenerated: true,
        status: isPending ? 'PENDING' : 'COMPLETED',
        date: new Date(),
        details: {
          inventoryValue: totalPurchaseCost,
          counterparty: supplier,
          dueDate: isPending ? (dueDate ? new Date(dueDate) : null) : null,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} item(s) with new batches.${newlyCreatedCount ? ` ${newlyCreatedCount} new item(s) auto-created.` : ''}${unitMismatches.length ? ` ${unitMismatches.length} row(s) had their unit auto-converted.` : ''}`,
      updatedCount,
      newlyCreatedCount,
      newItemsCreated: newItemsCreated.length ? newItemsCreated : null,
      failedCount: failedSkus.length,
      failedSkus: failedSkus.length > 0 ? failedSkus : null,
      unitMismatches: unitMismatches.length > 0 ? unitMismatches : null,
    });

  } catch (error) {
    console.error('Purchase CSV Error:', error);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ message: 'Error processing purchase CSV', details: error.message });
  }
};


/**
 * @desc   Get stock movement history for an item
 * @route  GET /api/inventory/items/:id/movements
 */
exports.getStockMovements = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, type } = req.query;
    const restaurantId = req.user.restaurantId;

    const query = { inventoryItem: id, restaurantId };
    if (type) query.type = type;

    const movements = await StockMovement.find(query)
      .populate('menuItemId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StockMovement.countDocuments(query);

    res.status(200).json({ success: true, movements, total });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching movements' });
  }
};

/**
 * @desc   Link ingredients to a menu item (Recipe Builder)
 * @route  PUT /api/menu/:id/ingredients
 */
exports.updateMenuItemIngredients = async (req, res) => {
  try {
    const { ingredients, customizationOptions } = req.body;
    const restaurantId = req.user.restaurantId;
    

    // Validate and Map
    const formattedIngredients = ingredients.map(ing => ({
      inventoryItem: ing.inventoryItem,
      quantityRequired: Number(ing.quantityRequired), 
      unit: ing.unit || 'g',
      isOptional: ing.isOptional || false
    }));

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId },
      {
        $set: {
          ingredients: formattedIngredients, 
          customizationOptions: customizationOptions || []
        }
      },
      { returnDocument: 'after', runValidators: true } 
    ).populate('ingredients.inventoryItem', 'name unit currentStock');

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    const updated = await recalculateMenuItemAvailability(menuItem._id);

    res.status(200).json({ success: true, item: menuItem });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error updating ingredients' });
  }
};

/**
 * @desc   Preview ingredient impact before confirming an order
 * @route  POST /api/inventory/preview-deduction
 * @body   { items: [{ menuItemId, qty, customizations }] }
 */
exports.previewDeduction = async (req, res) => {
  try {
    const { items } = req.body;
    const restaurantId = req.user.restaurantId;
    const preview = [];

    for (const item of items) {
      const ingredients = await resolveIngredients(item.menuItemId, item.customizations || []);

      for (const ing of ingredients) {
        const stock = await Inventory.findOne({
          _id: ing.inventoryItemId,
          restaurantId
        }, 'name currentStock minimumStock unit');

        const needed = ing.quantity * item.qty;
        preview.push({
          ingredientName: stock?.name || 'Unknown',
          currentStock:   stock?.currentStock || 0,
          needed,
          sufficient:     (stock?.currentStock || 0) >= needed,
          unit:           ing.unit
        });
      }
    }

    const hasShortage = preview.some(p => !p.sufficient);
    res.status(200).json({ success: true, preview, hasShortage });
  } catch (err) {
    res.status(500).json({ message: 'Error calculating preview' });
  }
};

/**
 * @desc   Search food databases for ingredient suggestions
 * @route  GET /api/inventory/food-search?q=tomato&source=usda
 */
exports.searchFoodDatabase = async (req, res) => {
  try {
    const { q, source = 'usda' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters' });
    }

    let results = [];
    if (source === 'usda') {
      const raw = await searchUSDA(q.trim(), 10);

      results = raw
        .filter(f => f.description && typeof f.description === 'string')
        .map(f => ({
          fdcId:     f.fdcId,
          name:      f.description,
          category:  f.foodCategory || 'Uncategorised',
          nutrients: extractNutrients(f),
        }));
    }

    res.status(200).json({ success: true, results, source });
  } catch (err) {
    res.status(500).json({ message: 'Food database search failed' });
  }
};

/**
 * @desc   Lookup product by barcode (Open Food Facts)
 * @route  GET /api/inventory/barcode/:barcode
 */
exports.lookupBarcode = async (req, res) => {
  try {
    const result = await lookupBarcode(req.params.barcode);

    if (!result) {
      return res.status(404).json({ message: 'Product not found for this barcode' });
    }

    res.status(200).json({ success: true, product: result });
  } catch (err) {
    res.status(500).json({ message: 'Barcode lookup failed' });
  }
};

/**
 * @desc   Import a USDA food item directly into inventory
 * @route  POST /api/inventory/import-from-usda
 * @body   { fdcId, costPerUnit, minimumStock, supplier }
 */
exports.importFromUSDA = async (req, res) => {
  try {
    const { fdcId, costPerUnit = 0, minimumStock = 5, supplier = '' } = req.body;
    const restaurantId = req.user.restaurantId;

    const foodData = await getUSDAFoodById(fdcId);
    if (!foodData) {
      return res.status(404).json({ message: 'USDA food item not found' });
    }

    // Check for duplicate
    const existing = await Inventory.findOne({
      restaurantId,
      name: { $regex: new RegExp(`^${foodData.name}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({
        message: `"${foodData.name}" already exists in your inventory`,
        existing
      });
    }

    const newItem = await Inventory.create({
      restaurantId,
      name:         foodData.name,
      sku:          `USDA-${fdcId}`,
      category:     foodData.category,
      unit:         foodData.unit,
      currentStock: 0,
      minimumStock,
      costPerUnit,
      supplier,
      description:  `Imported from USDA FoodData Central (FDC ID: ${fdcId})`,
      nutrients:    foodData.nutrients,
      batches:      []
    });

    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    console.error('USDA import error:', err);
    res.status(500).json({ message: 'Import failed' });
  }
};

/**
 * @desc   Import a scanned barcode product into inventory
 * @route  POST /api/inventory/import-from-barcode
 * @body   { barcode, costPerUnit, minimumStock }
 */
exports.importFromBarcode = async (req, res) => {
  try {
    const { barcode, costPerUnit = 0, minimumStock = 5 } = req.body;
    const restaurantId = req.user.restaurantId;

    const product = await lookupBarcode(barcode);
    if (!product) {
      return res.status(404).json({ message: 'Product not found for this barcode' });
    }

    const existing = await Inventory.findOne({ restaurantId, name: product.name });
    if (existing) {
      return res.status(409).json({
        message: `"${product.name}" already exists`,
        existing
      });
    }

    const newItem = await Inventory.create({
      restaurantId,
      name:         product.name,
      category:     product.category,
      unit:         product.unit,
      currentStock: 0,
      minimumStock,
      costPerUnit,
      supplier:     product.brand || '',
      description:  `Barcode: ${barcode}`,
      batches:      []
    });

    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ message: 'Barcode import failed' });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;

    // Guard: block deletion if this item is referenced by any recipe
    const usedInMenu = await MenuItem.findOne({
      restaurantId,
      $or: [
        { 'ingredients.inventoryItem': id },
        { 'customizationOptions.ingredientEffects.inventoryItem': id }
      ]
    }, 'name');

    if (usedInMenu) {
      return res.status(409).json({
        message: `Cannot delete — this item is used in the recipe for "${usedInMenu.name}". Remove it from that recipe first.`
      });
    }

    const deleted = await Inventory.findOneAndDelete({ _id: id, restaurantId });
    if (!deleted) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting item' });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const restaurantId = req.user.restaurantId;

    const item = await Inventory.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: { isAvailable } },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });

    res.status(200).json({ success: true, isAvailable: item.isAvailable });
  } catch (err) {
    res.status(500).json({ message: 'Error updating availability' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const restaurantId = req.user.restaurantId;

    const item = await Inventory.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: { currentStock: stock } },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });

    await recalculateAvailabilityForInventoryItem(item._id, restaurantId, req.io);

    res.status(200).json({ success: true, stock: item.currentStock });
  } catch (err) {
    res.status(500).json({ message: 'Error updating stock' });
  }
};

/**
 * @desc    Update item's price, expiry date, unit, or other core fields.
 *          If unit changes, converts currentStock + all batch quantities
 *          into the new unit so real quantities are preserved.
 * @route   PUT /api/inventory/items/:id
 */
exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;
    const { costPerUnit, expiryDate, unit, minimumStock, category, name, supplier } = req.body;

    const item = await Inventory.findOne({ _id: id, restaurantId });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Unit change requires converting existing quantities, not just relabeling
    if (unit && unit !== item.unit) {
      const { convertQuantity } = require('../utils/unitConversion.util');
      try {
        item.currentStock = convertQuantity(item.currentStock, item.unit, unit);
        if (item.batches?.length) {
          item.batches.forEach(b => {
            b.quantity = convertQuantity(b.quantity, item.unit, unit);
          });
        }
        item.unit = unit;
      } catch (conversionErr) {
        // e.g. trying to convert "kg" -> "ml" (incompatible families)
        return res.status(400).json({ message: `Cannot change unit: ${conversionErr.message}` });
      }
    }

    if (costPerUnit !== undefined) item.costPerUnit = Number(costPerUnit) || 0;
    if (expiryDate !== undefined) item.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (minimumStock !== undefined) item.minimumStock = Number(minimumStock);
    if (category !== undefined) item.category = category;
    if (name !== undefined) item.name = name.trim();
    if (supplier !== undefined) item.supplier = supplier;

    await item.save();
    await recalculateAvailabilityForInventoryItem(item._id, restaurantId, req.io);

    res.status(200).json({ success: true, item });
  } catch (err) {
    console.error('Update Inventory Item Error:', err);
    res.status(500).json({ message: err.message || 'Error updating item' });
  }
};


