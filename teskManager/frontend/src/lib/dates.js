// All helpers work in LOCAL time so dates match what the user sees on their calendar,
// regardless of timezone. (Mixing local-parsed dates with toISOString() produces off-by-one
// bugs in non-UTC timezones — e.g. IST users would see "extend +1" return the same date.)
const isoLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const today = () => isoLocal(new Date());

export function getWeekDates(base = new Date()) {
  const s = new Date(base);
  s.setDate(s.getDate() - s.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(s);
    d.setDate(s.getDate() + i);
    return isoLocal(d);
  });
}

export const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoLocal(d);
};

export const fmtRelative = (iso) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};
