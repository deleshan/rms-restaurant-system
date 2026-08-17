const axios = require('axios');

const USDA_API_KEY = process.env.USDA_API_KEY; 

exports.searchUSDA = async (query) => {
  try {
    const { data } = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
      params: { query, api_key: USDA_API_KEY, dataType: 'Foundation,SR Legacy', pageSize: 5 }
    });
    return data.foods || [];
  } catch (err) {
    console.error('USDA fetch error:', err.message);
    return [];
  }
};

exports.extractNutrients = (food) => {
  const find = (id) => food.foodNutrients?.find(n => n.nutrientId === id)?.value || 0;
  return {
    calories: find(1008),
    protein:  find(1003),
    fat:      find(1004),
    carbs:    find(1005),
  };
};