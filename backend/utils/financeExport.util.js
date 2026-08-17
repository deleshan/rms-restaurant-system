/**
 * Converts an array of flat objects into CSV text.
 * Minimal, dependency-free CSV builder — good enough for finance exports
 * since Excel/Sheets opens CSV natively.
 */
const toCSV = (rows) => {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = String(val ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ];
  return lines.join('\n');
};

module.exports = { toCSV };