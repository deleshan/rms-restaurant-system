/**
 * Calculates minutes elapsed since an order was created.
 * @param {string} timestamp - ISO date string
 * @returns {number} minutes
 */
export const getMinutesElapsed = (timestamp) => {
  const start = new Date(timestamp);
  const now = new Date();
  const diffInMs = now - start;
  return Math.floor(diffInMs / 1000 / 60);
};

/**
 * Formats seconds/minutes into a MM:SS format for the ticket timer.
 */
export const formatDuration = (timestamp) => {
  const diffInSeconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  const mins = Math.floor(diffInSeconds / 60);
  const secs = diffInSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Determines the urgency color based on elapsed time.
 */
export const getUrgencyLevel = (timestamp, warningMin = 10, urgentMin = 15) => {
  const elapsed = getMinutesElapsed(timestamp);
  if (elapsed >= urgentMin) return 'urgent'; // Red
  if (elapsed >= warningMin) return 'warning'; // Amber
  return 'normal'; // Green/White
};