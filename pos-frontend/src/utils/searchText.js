/**
 * Accent-insensitive text for menu search (Vietnamese diacritics + đ).
 */
export function normalizeSearchText(text) {
  if (text == null) return "";
  return String(text)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Full-text match: every whitespace-separated query token must appear in haystack
 * (substring), after accent normalization.
 */
export function matchesFullTextSearch(haystack, query) {
  const normalizedHaystack = normalizeSearchText(haystack);
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((token) => normalizedHaystack.includes(token));
}