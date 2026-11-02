/**
 * System Health & Storage Utility Functions
 */

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  const formatted = val % 1 === 0 ? val.toString() : val.toFixed(1);
  return `${formatted} ${sizes[i]}`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}h`);
  if (h > 0) parts.push(`${h}j`);
  if (m > 0) parts.push(`${m}m`);
  if (parts.length === 0 || s > 0) parts.push(`${s}d`);
  return parts.join(" ");
}

/**
 * Returns quota in bytes based on subscription tier.
 * Default mapping:
 * - TRIAL / STARTER: 500 MB
 * - PRO / PROFESSIONAL / MONTHLY: 2 GB
 * - YEARLY / ENTERPRISE / CUSTOM: 10 GB
 */
export function getPlanStorageQuotaBytes(tier: string): number {
  const t = (tier || "").toUpperCase();
  if (t.includes("ENTERPRISE") || t.includes("YEARLY") || t.includes("CUSTOM")) {
    return 10 * 1024 * 1024 * 1024; // 10 GB
  }
  if (t.includes("PRO") || t.includes("MONTHLY") || t.includes("BUSINESS")) {
    return 2 * 1024 * 1024 * 1024; // 2 GB
  }
  return 500 * 1024 * 1024; // 500 MB default
}
