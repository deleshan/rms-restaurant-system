const axios = require('axios');

// Match this to your Python script port (app.run(port=5001))
const PYTHON_SERVICE_URL = process.env.PYTHON_AI_URL || 'http://127.0.0.1:5001';

const pythonAI = {
  /**
   * Sends customer data to Python for K-Means Clustering
   * @param {Array} customers - Array of customer objects from MongoDB
   */
  getCustomerClusters: async (customers) => {
    try {
      const response = await axios.post(`${PYTHON_SERVICE_URL}/cluster-customers`, 
        { customers }, 
        { timeout: 5000 } // 5 second timeout
      );
      return response.data;
    } catch (error) {
      console.error('Error connecting to Python Clustering Service:', error.message);
      // Return a fallback structure so the dashboard doesn't crash
      return { 
        success: false, 
        clusters: { vip_count: 0, regular_count: 0, at_risk_count: 0 } 
      };
    }
  },

  /**
   * Sends review text to Python for VADER Sentiment Analysis
   * @param {String} text - Customer review comment
   */
  analyzeSentiment: async (text) => {
    try {
      const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze-sentiment`, 
        { text },
        { timeout: 3000 }
      );
      return response.data;
    } catch (error) {
      console.error('Error connecting to Python Sentiment Service:', error.message);
      return { sentiment: 'Neutral', score: 0, keywords: [] };
    }
  }
};

module.exports = pythonAI;