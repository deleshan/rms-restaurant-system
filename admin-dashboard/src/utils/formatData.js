import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { enUS } from 'date-fns/locale';

const DATE_FORMATS = {
  short: 'MMM d, yyyy',           // Jan 15, 2025
  medium: 'MMMM d, yyyy',         // January 15, 2025
  long: 'EEEE, MMMM d, yyyy',     // Wednesday, January 15, 2025
  time: 'h:mm a',                 // 3:45 PM
  dateTime: 'MMM d, yyyy h:mm a', // Jan 15, 2025 3:45 PM
  api: 'yyyy-MM-dd',              // 2025-01-15 (for API)
  apiDateTime: 'yyyy-MM-dd HH:mm:ss', // 2025-01-15 15:45:00
};

/**
 * Formats a date string or Date object
 * @param {string|Date|number} dateInput - Date to format
 * @param {string} [formatStr=DATE_FORMATS.short] - Format pattern (date-fns style)
 * @param {Object} [options] - date-fns format options
 * @returns {string} Formatted date or '—' if invalid
 */
export const formatDate = (dateInput, formatStr = DATE_FORMATS.short, options = {}) => {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  return format(date, formatStr, { locale: enUS, ...options });
};

/**
 * Formats date + time
 */
export const formatDateTime = (dateInput) => {
  return formatDate(dateInput, DATE_FORMATS.dateTime);
};

/**
 * Formats only time
 */
export const formatTime = (dateInput) => {
  return formatDate(dateInput, DATE_FORMATS.time);
};

/**
 * Formats date in API-friendly format (yyyy-MM-dd)
 */
export const formatApiDate = (dateInput) => {
  return formatDate(dateInput, DATE_FORMATS.api);
};

/**
 * Formats date + time in API-friendly format
 */
export const formatApiDateTime = (dateInput) => {
  return formatDate(dateInput, DATE_FORMATS.apiDateTime);
};

/**
 * Human-friendly relative time (e.g. "5 minutes ago", "yesterday", "in 3 days")
 * @param {string|Date|number} dateInput
 * @param {Object} [options] - date-fns options
 * @returns {string}
 */
export const formatRelative = (dateInput, options = {}) => {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: enUS,
    ...options,
  });
};

/**
 * Very friendly format: "Today at 3:45 PM", "Yesterday at 10:20 AM", "Jan 15 at 2:30 PM"
 */
export const formatFriendlyDateTime = (dateInput) => {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  if (isToday(date)) {
    return `Today at ${format(date, DATE_FORMATS.time)}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, DATE_FORMATS.time)}`;
  }

  return format(date, DATE_FORMATS.dateTime);
};

/**
 * Returns only "Today", "Yesterday", or formatted date
 */
export const formatDayLabel = (dateInput) => {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';

  return format(date, DATE_FORMATS.short);
};

/**
 * Formats a duration in minutes to human-readable (e.g. "45 min", "2 hr 15 min")
 * Useful for preparation time, delivery time, etc.
 */
export const formatDuration = (minutes) => {
  if (!minutes || isNaN(minutes)) return '—';

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;

  return `${hrs} hr ${mins} min`;
};

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatApiDate,
  formatApiDateTime,
  formatRelative,
  formatFriendlyDateTime,
  formatDayLabel,
  formatDuration,
  DATE_FORMATS,
};