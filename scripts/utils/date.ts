/**
 * Standardizes a date into YYYY-MM-DD format.
 */
export function formatToDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Standardizes raw API timestamps into standard ISO 8601 strings.
 */
export function parseToIsoString(rawDate: string | number): string {
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}
