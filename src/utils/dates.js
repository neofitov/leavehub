// Date helpers. Leave requests use plain 'YYYY-MM-DD' date strings.

/** Today as 'YYYY-MM-DD' (local). */
export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** Inclusive number of calendar days between two 'YYYY-MM-DD' dates. */
export function inclusiveDays(startISO, endISO) {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  const diff = Math.round((end - start) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
}

/** Human-friendly date, e.g. "20 Jul 2026". Accepts a date or timestamp string. */
export function formatDate(value) {
  if (!value) return '';
  const iso = String(value).length <= 10 ? value + 'T00:00:00' : value;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Compact range, e.g. "20–24 Jul 2026" or "28 Jul – 1 Aug 2026". */
export function formatRange(startISO, endISO) {
  if (startISO === endISO) return formatDate(startISO);
  return `${formatDate(startISO)} – ${formatDate(endISO)}`;
}
