import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook to calculate live elapsed time for a kitchen ticket.
 * @param {string} startTime - The ISO string or timestamp of when the order was created.
 * @returns {Object} - { minutes, seconds, totalSeconds, isUrgent }
 */
export const useTimer = (startTime) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update the 'now' state every second
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const start = new Date(startTime).getTime();
    const current = now.getTime();
    
    // Calculate total elapsed seconds
    const totalSeconds = Math.max(0, Math.floor((current - start) / 1000));
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // A ticket becomes "urgent" after 15 minutes
    const isUrgent = minutes >= 15;

    return {
      minutes,
      seconds,
      totalSeconds,
      isUrgent,
      // Formatted string: e.g., "05:12"
      formatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    };
  }, [startTime, now]);

  return stats;
};