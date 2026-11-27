/**
 * Formats a date string into DD/MM/YYYY format.
 * @param {string|Date} date - The date to format (e.g., '2026-04-04' or ISO string)
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    // Fallback for yyyy-mm-dd strings if Date parsing fails or gives unexpected results
    if (typeof date === 'string' && date.includes('-')) {
      const parts = date.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
    return date;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formats a time string into 12-hour format (hh:mm AM/PM).
 * @param {string} time - The time string (e.g., '14:30', '14:30:00', or ISO string)
 * @returns {string} - Formatted time string
 */
export const formatTime = (time) => {
  if (!time) return '';

  let hours, minutes;

  // Handle 'HH:mm' or 'HH:mm:ss' format
  if (typeof time === 'string' && time.includes(':')) {
    const parts = time.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  } else {
    const d = new Date(time);
    if (isNaN(d.getTime())) return time;
    hours = d.getHours();
    minutes = d.getMinutes();
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');

  return `${String(displayHours).padStart(2, '0')}:${displayMinutes} ${ampm}`;
};

/** Display date like "Fri, 28 Nov" from 'YYYY-MM-DD' (no timezone shift). */
export const prettyDate = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).split('T')[0].split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return String(ymd);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};
