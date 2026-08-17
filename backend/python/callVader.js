const vader = require('vader-sentiment');

/**
 * Analyzes sentiment of a single text using VADER
 * @param {string} text - The review/feedback text to analyze
 * @returns {Object} Sentiment result with compound score and classification
 */
function analyzeSentiment(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return {
      compound: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      sentiment: 'neutral',
      error: 'Empty or invalid text provided',
    };
  }

  try {
    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text.trim());

    let sentimentLabel = 'neutral';
    if (intensity.compound >= 0.05) sentimentLabel = 'positive';
    if (intensity.compound <= -0.05) sentimentLabel = 'negative';

    return {
      compound: intensity.compound,
      positive: intensity.pos,
      neutral: intensity.neu,
      negative: intensity.neg,
      sentiment: sentimentLabel,
      rawText: text.trim(),
    };
  } catch (err) {
    console.error('VADER analysis error:', err);
    return {
      compound: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      sentiment: 'error',
      error: 'Failed to analyze sentiment',
    };
  }
}

/**
 * Analyzes multiple reviews/comments at once
 * @param {Array<string>} texts - Array of review texts
 * @returns {Array<Object>} Array of sentiment results
 */
function analyzeMultiple(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [{ error: 'No texts provided for batch analysis' }];
  }

  return texts.map(text => analyzeSentiment(text));
}


if (require.main === module) {
  const sampleReviews = [
    "Amazing food, best butter chicken ever! 😍",
    "Service was slow and food was cold",
    "It was okay, nothing special",
    "Worst experience, will never come back",
    "Love the ambiance and staff were very friendly",
  ];

  console.log('Single review example:');
  console.log(analyzeSentiment(sampleReviews[0]));

  console.log('\nBatch analysis:');
  console.log(analyzeMultiple(sampleReviews));
}

module.exports = {
  analyzeSentiment,
  analyzeMultiple,
};