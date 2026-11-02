/**
 * Client- and edge-safe authentication & layout display utilities.
 * Pure helpers with zero server dependencies (no next/headers, no filesystem/database).
 */

/**
 * Safely extracts up to 2 uppercase initials from a user's display name.
 * Handles Unicode surrogate pairs (e.g. emojis), extra whitespace, and empty fallbacks.
 */
export function getUserInitials(name?: string | null, fallback = "SA"): string {
  if (!name || typeof name !== "string") return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  const initials = words
    .slice(0, 2)
    .map((w) => {
      const chars = Array.from(w);
      return (chars[0] || "").toUpperCase();
    })
    .join("");
  return initials || fallback;
}
