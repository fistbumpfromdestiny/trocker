/**
 * Format date to Swedish format (YYYY-MM-DD)
 */
export function formatSwedishDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date and time to Swedish format (YYYY-MM-DD HH:MM)
 */
export function formatSwedishDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const datePart = formatSwedishDate(d);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${datePart} ${hours}:${minutes}`;
}

/**
 * Format date to short Swedish format (YY-MM-DD)
 */
export function formatSwedishDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = String(d.getFullYear()).slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
