/**
 * Frontend time formatting utilities.
 * All timestamps are displayed in Asia/Taipei (UTC+8) timezone.
 */

const TAIPEI_TZ = "Asia/Taipei";

/**
 * Format a Date object to `YYYY/MM/DD HH:mm:ss` in Asia/Taipei timezone.
 */
function _formatDate(date: Date): string {
  const fmt = new Intl.DateTimeFormat("zh-TW", {
    timeZone: TAIPEI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Intl gives us parts like { type: 'year', value: '2026' } ...
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );

  // Normalise: Intl may use "24" for midnight — clamp to 00
  const hour = parts.hour === "24" ? "00" : parts.hour;

  return `${parts.year}/${parts.month}/${parts.day} ${hour}:${parts.minute}:${parts.second}`;
}

/**
 * Format a Unix timestamp (seconds) to `YYYY/MM/DD HH:mm:ss` (UTC+8).
 *
 * @param ts - Unix timestamp in **seconds** (number), or 0/undefined/null → returns ""
 */
export function formatTsToTaipei(ts: number | null | undefined): string {
  if (!ts) return "";
  return _formatDate(new Date(ts * 1000));
}

/**
 * Format an ISO-8601 string or any string parseable by `new Date()` to
 * `YYYY/MM/DD HH:mm:ss` (UTC+8).
 *
 * Handles both UTC strings (`2026-07-15T02:57:39.000Z`) and
 * offset strings (`2026-07-15T10:57:39+08:00`).
 *
 * @param iso - ISO date string, or null/undefined/empty string → returns ""
 */
export function formatIsoToTaipei(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // fallback: return original
  return _formatDate(d);
}

/**
 * Accept either a Unix-second timestamp (number) OR an ISO string
 * and return a formatted `YYYY/MM/DD HH:mm:ss` (UTC+8) string.
 */
export function formatAnyToTaipei(
  value: number | string | null | undefined
): string {
  if (value == null || value === "") return "";
  if (typeof value === "number") return formatTsToTaipei(value);
  return formatIsoToTaipei(value);
}
