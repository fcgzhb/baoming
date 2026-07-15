/**
 * Format an ISO/timestamp string for display in admin tables.
 * Returns 'YYYY-MM-DD HH:mm' (or HH:mm:ss when seconds present).
 * Returns '-' for null/empty/invalid input.
 */
export function formatDateTime(input?: string | null | Date): string {
  if (!input) return '-';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day} ${h}:${min}`;
}

/** Date only: YYYY-MM-DD. */
export function formatDate(input?: string | null | Date): string {
  if (!input) return '-';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
