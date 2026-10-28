// Formatters, initials and share-link builders.

/** 12847 -> '12,847' */
export const fmtInt = (n) => Math.trunc(Number(n) || 0).toLocaleString("en-US");

/** 45600 -> '45.6K', 1400 -> '1.4K', 850 -> '850', 2300000 -> '2.3M' */
export function fmtCompact(n) {
  n = Number(n) || 0;
  for (const [limit, suffix] of [[1_000_000, "M"], [1_000, "K"]]) {
    if (Math.abs(n) >= limit) {
      const v = n / limit;
      return v < 100 ? v.toFixed(1).replace(/0+$/, "").replace(/\.$/, "") + suffix : `${v.toFixed(0)}${suffix}`;
    }
  }
  return `${Math.trunc(n)}`;
}

/** 1200 -> '+1.2k' (lowercaseK) or '+1.2K'; 210 -> '+210'; negatives keep their minus. */
export function fmtDelta(n, lowercaseK = false) {
  n = Number(n) || 0;
  const sign = n >= 0 ? "+" : "-";
  const text = fmtCompact(Math.abs(n));
  return sign + (lowercaseK ? text.replace("K", "k") : text);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** '2026-10-05T..' -> 'Oct 5, 2026' (the date part is used as sent by the backend). */
export function fmtDate(value) {
  if (!value) return "-";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function initials(name = "") {
  const parts = name.replace(/\./g, " ").split(/\s+/).filter((p) => p && p.toLowerCase() !== "dr");
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
}

export const titleCase = (s = "") => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ---- links ----
export const publicUrl = () => (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/+$/, "");

export const profileLinks = () => ({
  Instagram: import.meta.env.VITE_INSTAGRAM_URL || "https://www.instagram.com/",
  Facebook: import.meta.env.VITE_FACEBOOK_URL || "https://www.facebook.com/",
  YouTube: import.meta.env.VITE_YOUTUBE_URL || "https://www.youtube.com/",
});

/** Share URLs for WhatsApp, Facebook, X and LinkedIn. */
export function shareLinks(url, text) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return {
    WhatsApp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    Facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    X: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  };
}
