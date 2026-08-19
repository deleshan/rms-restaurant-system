const axios = require('axios');

const USDA_API_KEY = process.env.USDA_API_KEY; // Get free at api.nal.usda.gov
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

/**
 * Search USDA FoodData Central for ingredients
 * Free API — get key at https://fdc.nal.usda.gov/api-key-signup.html
 */
const searchUSDA = async (query, pageSize = 50, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
        params: {
          query,
          api_key: process.env.USDA_API_KEY,
          pageSize
        }
      });
      return data.foods || [];
    } catch (err) {
      const status = err.response?.status;
      console.error(`USDA search attempt ${attempt} failed:`, status, err.message);

      // Retry on 404 or 429 (rate limit) after a delay
      if ((status === 404 || status === 429) && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 800)); // 800ms, 1600ms
        continue;
      }
      return [];
    }
  }
  return [];
};


/**
 * Get full details for a single USDA food item by fdcId
 */
const getUSDAFoodById = async (fdcId) => {
  try {
    const response = await axios.get(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}`, {
      params: { api_key: process.env.USDA_API_KEY } 
    });

    const food = response.data;
    return {
      fdcId:    food.fdcId,
      name:     food.description,
      category: mapUSDACategory(food.foodCategory?.description || ''),
      unit:     'Kg',
      nutrients: {
        calories: getNutrient(food.foodNutrients, 'Energy'),
        protein:  getNutrient(food.foodNutrients, 'Protein'),
        fat:      getNutrient(food.foodNutrients, 'Total lipid (fat)'),
        carbs:    getNutrient(food.foodNutrients, 'Carbohydrate, by difference'),
      },
      source: 'USDA'
    };
  } catch (err) {
    console.error('USDA fetch error:', err.message);
    return null;
  }
};

/**
 * Open Food Facts — barcode lookup
 * No API key needed, completely free
 */
const lookupBarcode = async (barcode) => {
  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );

    const p = response.data?.product;
    if (!p) return null;

    return {
      barcode,
      name:        p.product_name || p.product_name_en || 'Unknown',
      brand:       p.brands || '',
      category:    mapOFFCategory(p.categories_tags?.[0] || ''),
      unit:        detectUnit(p.quantity || ''),
      packageSize: parseFloat(p.quantity) || null,
      nutrients: {
        calories: p.nutriments?.['energy-kcal_100g'] || 0,
        protein:  p.nutriments?.proteins_100g || 0,
        fat:      p.nutriments?.fat_100g || 0,
        carbs:    p.nutriments?.carbohydrates_100g || 0,
      },
      imageUrl: p.image_front_url || '',
      source: 'OpenFoodFacts'
    };
  } catch (err) {
    console.error('Barcode lookup error:', err.message);
    return null;
  }
};

/**
 * Edamam — parse natural language ingredient strings
 * e.g. "2 cups all-purpose flour" → structured ingredient data
 * Free: 400 calls/month at developer.edamam.com
 */
const parseIngredientText = async (ingredientText) => {
  try {
    const response = await axios.get('https://api.edamam.com/api/nutrition-data', {
      params: {
        app_id:  EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        ingr:    ingredientText
      }
    });

    const data = response.data;
    return {
      parsed:   ingredientText,
      weight:   data.totalWeight || 0, // in grams
      calories: data.calories || 0,
      nutrients: {
        protein: data.totalNutrients?.PROCNT?.quantity || 0,
        fat:     data.totalNutrients?.FAT?.quantity || 0,
        carbs:   data.totalNutrients?.CHOCDF?.quantity || 0,
      },
      source: 'Edamam'
    };
  } catch (err) {
    console.error('Edamam parse error:', err.message);
    return null;
  }
};

// HELPERS 
const getNutrient = (nutrients = [], name) => {
  const found = nutrients.find(n =>
    n.nutrientName?.toLowerCase().includes(name.toLowerCase())
  );
  return found ? Math.round(found.value * 100) / 100 : 0;
};

const mapUSDACategory = (category = '') => {
  const c = category.toLowerCase();
  if (c.includes('vegetable') || c.includes('fruit'))  return 'Produce';
  if (c.includes('beef') || c.includes('pork') || c.includes('chicken') || c.includes('poultry')) return 'Meat';
  if (c.includes('dairy') || c.includes('milk') || c.includes('cheese')) return 'Dairy';
  if (c.includes('grain') || c.includes('bread') || c.includes('cereal')) return 'Grains';
  if (c.includes('spice') || c.includes('herb')) return 'Spices';
  if (c.includes('beverage') || c.includes('drink')) return 'Beverages';
  return 'Dry Goods';
};

const mapOFFCategory = (tag = '') => {
  const t = tag.replace('en:', '').toLowerCase();
  if (t.includes('vegetable') || t.includes('fruit')) return 'Produce';
  if (t.includes('meat'))    return 'Meat';
  if (t.includes('dairy'))   return 'Dairy';
  if (t.includes('grain') || t.includes('cereal')) return 'Grains';
  if (t.includes('spice'))   return 'Spices';
  if (t.includes('beverage') || t.includes('drink')) return 'Beverages';
  return 'Dry Goods';
};

const detectUnit = (quantityStr = '') => {
  if (quantityStr.includes('kg'))  return 'kg';
  if (quantityStr.includes('ml'))  return 'ml';
  if (quantityStr.includes('l') || quantityStr.includes('L')) return 'l';
  if (quantityStr.includes('g'))   return 'g';
  return 'pcs';
};

const extractNutrients = (food) => {
  const find = (id) => food.foodNutrients?.find(n => n.nutrientId === id)?.value || 0;
  return {
    calories: find(1008),
    protein:  find(1003),
    fat:      find(1004),
    carbs:    find(1005),
  };
};

module.exports = {
  searchUSDA,
  getUSDAFoodById,
  lookupBarcode,
  parseIngredientText,
  extractNutrients,
  mapUSDACategory,

};