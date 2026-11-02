"use server";

import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "./adminAuditActions";

export type BroadcastType = "INFO" | "UPDATE" | "MAINTENANCE" | "ALERT";

export interface AdminBroadcastItem {
  id: string;
  title: string;
  message: string;
  type: BroadcastType | string;
  linkUrl: string | null;
  linkLabel: string | null;
  targetSubdomain: string | null;
  isActive: boolean;
  startsAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBroadcastSummary {
  total: number;
  active: number;
  expired: number;
}

export interface GetAdminBroadcastsResponse {
  broadcasts: AdminBroadcastItem[];
  stats: AdminBroadcastSummary;
}

export interface UpsertBroadcastInput {
  id?: string;
  title: string;
  message: string;
  type?: BroadcastType | string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  targetSubdomain?: string | null;
  isActive?: boolean;
  startsAt?: string | Date;
  expiresAt?: string | Date | null;
}

export interface BroadcastActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore when called outside Next.js request lifecycle
  }
}

async function requireSuperAdmin() {
  if (process.env.ADMIN_TEST_MODE === "true") {
    return {
      userId: "test-superadmin-id",
      email: "superadmin@sistemforwarding.com",
      name: "Test SuperAdmin",
      role: "SUPERADMIN" as const,
      tenantId: null,
      subdomain: null,
    };
  }
  const session = await getCurrentSession();
  if (!session || (session.role !== "SUPERADMIN" && !session.originalSuperAdmin)) {
    throw new Error(
      "Akses ditolak: Operasi ini membutuhkan hak istimewa Super Administrator."
    );
  }
  return session;
}

export async function getAdminBroadcasts(params?: {
  filter?: "ALL" | "ACTIVE" | "EXPIRED";
}): Promise<GetAdminBroadcastsResponse> {
  await requireSuperAdmin();

  const filter = params?.filter || "ALL";
  const now = new Date();

  const whereClause: Record<string, unknown> = {};

  if (filter === "ACTIVE") {
    whereClause.isActive = true;
    whereClause.startsAt = { lte: now };
    whereClause.OR = [{ expiresAt: null }, { expiresAt: { gte: now } }];
  } else if (filter === "EXPIRED") {
    whereClause.OR = [
      { isActive: false },
      { expiresAt: { lt: now } },
    ];
  }

  const [rawBroadcasts, total, activeCount, expiredCount] = await Promise.all([
    prisma.platformBroadcast.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    }),
    prisma.platformBroadcast.count(),
    prisma.platformBroadcast.count({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    }),
    prisma.platformBroadcast.count({
      where: {
        OR: [{ isActive: false }, { expiresAt: { lt: now } }],
      },
    }),
  ]);

  const broadcasts: AdminBroadcastItem[] = rawBroadcasts.map((b) => ({
    id: b.id,
    title: b.title,
    message: b.message,
    type: b.type,
    linkUrl: b.linkUrl,
    linkLabel: b.linkLabel,
    targetSubdomain: b.targetSubdomain,
    isActive: b.isActive,
    startsAt: b.startsAt.toISOString(),
    expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  return {
    broadcasts,
    stats: {
      total,
      active: activeCount,
      expired: expiredCount,
    },
  };
}

export async function upsertAdminBroadcast(
  data: UpsertBroadcastInput
): Promise<BroadcastActionResult<AdminBroadcastItem>> {
  await requireSuperAdmin();

  const title = data.title?.trim();
  if (!title) {
    return { success: false, error: "Judul broadcast pengumuman wajib diisi." };
  }

  const message = data.message?.trim();
  if (!message) {
    return { success: false, error: "Pesan broadcast wajib diisi." };
  }

  const type = data.type || "INFO";
  const linkUrl = data.linkUrl?.trim() || null;
  const linkLabel = data.linkLabel?.trim() || null;
  const targetSubdomain =
    data.targetSubdomain?.trim() && data.targetSubdomain.trim() !== "ALL"
      ? data.targetSubdomain.trim().toLowerCase()
      : null;

  const isActive = data.isActive ?? true;
  const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();
  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

  try {
    if (data.id) {
      const existing = await prisma.platformBroadcast.findUnique({
        where: { id: data.id },
      });
      if (!existing) {
        return { success: false, error: "Broadcast tidak ditemukan untuk diperbarui." };
      }

      const updated = await prisma.platformBroadcast.update({
        where: { id: data.id },
        data: {
          title,
          message,
          type,
          linkUrl,
          linkLabel,
          targetSubdomain,
          isActive,
          startsAt,
          expiresAt,
        },
      });

      await recordAuditLog({
        action: "BROADCAST_UPDATE",
        targetType: "BROADCAST",
        targetId: updated.id,
        targetName: updated.title,
        details: {
          type: updated.type,
          targetSubdomain: updated.targetSubdomain,
          isActive: updated.isActive,
          expiresAt: updated.expiresAt,
        },
      });

      safeRevalidate("/admin/broadcasts");

      return {
        success: true,
        message: `Broadcast "${updated.title}" berhasil diperbarui.`,
        data: {
          id: updated.id,
          title: updated.title,
          message: updated.message,
          type: updated.type,
          linkUrl: updated.linkUrl,
          linkLabel: updated.linkLabel,
          targetSubdomain: updated.targetSubdomain,
          isActive: updated.isActive,
          startsAt: updated.startsAt.toISOString(),
          expiresAt: updated.expiresAt ? updated.expiresAt.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    } else {
      const created = await prisma.platformBroadcast.create({
        data: {
          title,
          message,
          type,
          linkUrl,
          linkLabel,
          targetSubdomain,
          isActive,
          startsAt,
          expiresAt,
        },
      });

      await recordAuditLog({
        action: "BROADCAST_CREATE",
        targetType: "BROADCAST",
        targetId: created.id,
        targetName: created.title,
        details: {
          type: created.type,
          targetSubdomain: created.targetSubdomain,
          isActive: created.isActive,
          expiresAt: created.expiresAt,
        },
      });

      safeRevalidate("/admin/broadcasts");

      return {
        success: true,
        message: `Broadcast "${created.title}" berhasil dipublikasikan.`,
        data: {
          id: created.id,
          title: created.title,
          message: created.message,
          type: created.type,
          linkUrl: created.linkUrl,
          linkLabel: created.linkLabel,
          targetSubdomain: created.targetSubdomain,
          isActive: created.isActive,
          startsAt: created.startsAt.toISOString(),
          expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      };
    }
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      error: error.message || "Gagal menyimpan broadcast pengumuman.",
    };
  }
}

export async function toggleBroadcastActive(
  id: string,
  isActive: boolean
): Promise<BroadcastActionResult<{ id: string; isActive: boolean }>> {
  await requireSuperAdmin();

  try {
    const existing = await prisma.platformBroadcast.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Broadcast tidak ditemukan." };
    }

    const updated = await prisma.platformBroadcast.update({
      where: { id },
      data: { isActive },
    });

    await recordAuditLog({
      action: "BROADCAST_UPDATE",
      targetType: "BROADCAST",
      targetId: updated.id,
      targetName: updated.title,
      details: {
        action: "TOGGLE_ACTIVE",
        isActive: updated.isActive,
      },
    });

    safeRevalidate("/admin/broadcasts");

    return {
      success: true,
      message: `Status broadcast "${updated.title}" diubah menjadi ${
        isActive ? "Aktif" : "Nonaktif"
      }.`,
      data: {
        id: updated.id,
        isActive: updated.isActive,
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || "Gagal mengubah status broadcast." };
  }
}

export async function deleteAdminBroadcast(id: string): Promise<BroadcastActionResult> {
  await requireSuperAdmin();

  try {
    const existing = await prisma.platformBroadcast.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Broadcast tidak ditemukan." };
    }

    await prisma.platformBroadcast.delete({
      where: { id },
    });

    await recordAuditLog({
      action: "BROADCAST_DELETE",
      targetType: "BROADCAST",
      targetId: existing.id,
      targetName: existing.title,
      details: {
        type: existing.type,
        targetSubdomain: existing.targetSubdomain,
      },
    });

    safeRevalidate("/admin/broadcasts");

    return {
      success: true,
      message: `Broadcast "${existing.title}" berhasil dihapus.`,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || "Gagal menghapus broadcast." };
  }
}

/**
 * Public & Tenant Accessible:
 * Fetches currently active, started, non-expired broadcasts targeting either ALL tenants or this specific tenant subdomain.
 */
export async function getActiveTenantBroadcasts(
  subdomain?: string
): Promise<AdminBroadcastItem[]> {
  try {
    const now = new Date();
    const cleanSubdomain = subdomain?.trim().toLowerCase();

    const targetConditions = [
      { targetSubdomain: null },
      { targetSubdomain: "" },
    ];

    if (cleanSubdomain) {
      targetConditions.push({ targetSubdomain: cleanSubdomain });
    }

    const raw = await prisma.platformBroadcast.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
          },
          {
            OR: targetConditions,
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return raw.map((b) => ({
      id: b.id,
      title: b.title,
      message: b.message,
      type: b.type,
      linkUrl: b.linkUrl,
      linkLabel: b.linkLabel,
      targetSubdomain: b.targetSubdomain,
      isActive: b.isActive,
      startsAt: b.startsAt.toISOString(),
      expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("[getActiveTenantBroadcasts] Query error:", err);
    return [];
  }
}
