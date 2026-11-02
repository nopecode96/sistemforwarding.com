"use server";

import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "./adminAuditActions";
import { Prisma } from "@prisma/client";

export interface ArticleSection {
  heading: string;
  body: string[];
  callout?: string;
}

export interface ArticleContentPayload {
  intro: string;
  sections: ArticleSection[];
  takeaways: string[];
}

export interface AdminArticleItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  coverImage: string | null;
  author: string;
  authorRole: string;
  readTime: string;
  content: ArticleContentPayload;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminArticleSummary {
  total: number;
  published: number;
  drafts: number;
}

export interface GetAdminArticlesResponse {
  articles: AdminArticleItem[];
  stats: AdminArticleSummary;
  categories: string[];
}

export interface UpsertArticleInput {
  id?: string;
  slug?: string;
  title: string;
  category: string;
  summary: string;
  coverImage?: string | null;
  author: string;
  authorRole: string;
  readTime?: string;
  content: ArticleContentPayload;
  isPublished?: boolean;
  publishedAt?: string | Date;
}

export interface ArticleActionResult<T = unknown> {
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

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function getAdminArticles(params?: {
  search?: string;
  category?: string;
  status?: "ALL" | "PUBLISHED" | "DRAFT";
}): Promise<GetAdminArticlesResponse> {
  await requireSuperAdmin();

  const search = params?.search?.trim();
  const category = params?.category?.trim();
  const status = params?.status || "ALL";

  const whereClause: Record<string, unknown> = {};

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category && category !== "ALL") {
    whereClause.category = category;
  }

  if (status === "PUBLISHED") {
    whereClause.isPublished = true;
  } else if (status === "DRAFT") {
    whereClause.isPublished = false;
  }

  const [rawArticles, total, published, drafts, distinctCategories] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    }),
    prisma.article.count(),
    prisma.article.count({ where: { isPublished: true } }),
    prisma.article.count({ where: { isPublished: false } }),
    prisma.article.findMany({
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const articles: AdminArticleItem[] = rawArticles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category,
    summary: a.summary,
    coverImage: a.coverImage,
    author: a.author,
    authorRole: a.authorRole,
    readTime: a.readTime,
    content: (a.content as unknown as ArticleContentPayload) || {
      intro: "",
      sections: [],
      takeaways: [],
    },
    isPublished: a.isPublished,
    publishedAt: a.publishedAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const categories = distinctCategories
    .map((c) => c.category)
    .filter(Boolean)
    .sort();

  return {
    articles,
    stats: {
      total,
      published,
      drafts,
    },
    categories,
  };
}

export async function getAdminArticleById(id: string): Promise<AdminArticleItem | null> {
  await requireSuperAdmin();

  if (!id) return null;

  const a = await prisma.article.findUnique({
    where: { id },
  });

  if (!a) return null;

  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category,
    summary: a.summary,
    coverImage: a.coverImage,
    author: a.author,
    authorRole: a.authorRole,
    readTime: a.readTime,
    content: (a.content as unknown as ArticleContentPayload) || {
      intro: "",
      sections: [],
      takeaways: [],
    },
    isPublished: a.isPublished,
    publishedAt: a.publishedAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function upsertAdminArticle(
  data: UpsertArticleInput
): Promise<ArticleActionResult<AdminArticleItem>> {
  await requireSuperAdmin();

  const title = data.title?.trim();
  if (!title) {
    return { success: false, error: "Judul artikel wajib diisi." };
  }

  const category = data.category?.trim();
  if (!category) {
    return { success: false, error: "Kategori artikel wajib diisi." };
  }

  const summary = data.summary?.trim();
  if (!summary) {
    return { success: false, error: "Ringkasan artikel wajib diisi." };
  }

  const author = data.author?.trim();
  if (!author) {
    return { success: false, error: "Nama penulis wajib diisi." };
  }

  const authorRole = data.authorRole?.trim();
  if (!authorRole) {
    return { success: false, error: "Peran/jabatan penulis wajib diisi." };
  }

  let existingArticle = null;
  if (data.id) {
    existingArticle = await prisma.article.findUnique({
      where: { id: data.id },
    });
    if (!existingArticle) {
      return { success: false, error: "Artikel tidak ditemukan untuk diperbarui." };
    }
  }

  // Slug resolution & uniqueness check
  // For updates: preserve existing slug unless a new custom slug is explicitly specified.
  // For creates: auto-generate from custom slug or title.
  const baseSlug =
    (data.slug?.trim()
      ? generateSlug(data.slug)
      : existingArticle
      ? existingArticle.slug
      : generateSlug(title)) || "artikel";
  let finalSlug = baseSlug;
  let counter = 1;

  while (true) {
    const collision = await prisma.article.findUnique({
      where: { slug: finalSlug },
      select: { id: true },
    });
    if (!collision || collision.id === data.id) {
      break;
    }
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
  }

  // Calculate readTime fallback
  let readTime = data.readTime?.trim();
  if (!readTime) {
    const totalWords =
      summary.split(/\s+/).length +
      (data.content?.intro?.split(/\s+/).length || 0) +
      (data.content?.sections?.reduce(
        (acc, sec) => acc + sec.body.join(" ").split(/\s+/).length,
        0
      ) || 0);
    const minutes = Math.max(2, Math.ceil(totalWords / 180));
    readTime = `${minutes} menit baca`;
  }

  const isPublished = data.isPublished ?? true;
  const publishedAt = data.publishedAt
    ? new Date(data.publishedAt)
    : isPublished
    ? new Date()
    : new Date();

  const contentJson = {
    intro: data.content?.intro || "",
    sections: Array.isArray(data.content?.sections) ? data.content.sections : [],
    takeaways: Array.isArray(data.content?.takeaways) ? data.content.takeaways : [],
  };

  try {
    if (data.id) {
      // Update existing article
      const updated = await prisma.article.update({
        where: { id: data.id },
        data: {
          slug: finalSlug,
          title,
          category,
          summary,
          coverImage: data.coverImage || null,
          author,
          authorRole,
          readTime,
          content: contentJson as unknown as Prisma.InputJsonValue,
          isPublished,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt)
            : existingArticle?.publishedAt || new Date(),
        },
      });

      await recordAuditLog({
        action: "ARTICLE_UPDATE",
        targetType: "ARTICLE",
        targetId: updated.id,
        targetName: updated.title,
        details: {
          slug: updated.slug,
          category: updated.category,
          isPublished: updated.isPublished,
        },
      });

      safeRevalidate("/admin/articles");
      safeRevalidate("/blog");
      safeRevalidate(`/blog/${updated.slug}`);

      return {
        success: true,
        message: `Artikel "${updated.title}" berhasil diperbarui.`,
        data: {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          category: updated.category,
          summary: updated.summary,
          coverImage: updated.coverImage,
          author: updated.author,
          authorRole: updated.authorRole,
          readTime: updated.readTime,
          content: contentJson,
          isPublished: updated.isPublished,
          publishedAt: updated.publishedAt.toISOString(),
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    } else {
      // Create new article
      const created = await prisma.article.create({
        data: {
          slug: finalSlug,
          title,
          category,
          summary,
          coverImage: data.coverImage || null,
          author,
          authorRole,
          readTime,
          content: contentJson as unknown as Prisma.InputJsonValue,
          isPublished,
          publishedAt,
        },
      });

      await recordAuditLog({
        action: "ARTICLE_CREATE",
        targetType: "ARTICLE",
        targetId: created.id,
        targetName: created.title,
        details: {
          slug: created.slug,
          category: created.category,
          isPublished: created.isPublished,
        },
      });

      safeRevalidate("/admin/articles");
      safeRevalidate("/blog");
      safeRevalidate(`/blog/${created.slug}`);

      return {
        success: true,
        message: `Artikel "${created.title}" berhasil diterbitkan.`,
        data: {
          id: created.id,
          slug: created.slug,
          title: created.title,
          category: created.category,
          summary: created.summary,
          coverImage: created.coverImage,
          author: created.author,
          authorRole: created.authorRole,
          readTime: created.readTime,
          content: contentJson,
          isPublished: created.isPublished,
          publishedAt: created.publishedAt.toISOString(),
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      };
    }
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      error: error.message || "Gagal menyimpan artikel.",
    };
  }
}

export async function toggleArticlePublish(
  id: string,
  isPublished: boolean
): Promise<ArticleActionResult<{ id: string; isPublished: boolean }>> {
  await requireSuperAdmin();

  try {
    const existing = await prisma.article.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Artikel tidak ditemukan." };
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished && !existing.isPublished ? new Date() : existing.publishedAt,
      },
    });

    await recordAuditLog({
      action: "ARTICLE_UPDATE",
      targetType: "ARTICLE",
      targetId: updated.id,
      targetName: updated.title,
      details: {
        action: "TOGGLE_PUBLISH",
        isPublished: updated.isPublished,
        slug: updated.slug,
      },
    });

    safeRevalidate("/admin/articles");
    safeRevalidate("/blog");
    safeRevalidate(`/blog/${updated.slug}`);

    return {
      success: true,
      message: `Status artikel "${updated.title}" diubah menjadi ${
        isPublished ? "Published" : "Draft"
      }.`,
      data: {
        id: updated.id,
        isPublished: updated.isPublished,
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || "Gagal mengubah status publish." };
  }
}

export async function deleteAdminArticle(id: string): Promise<ArticleActionResult> {
  await requireSuperAdmin();

  try {
    const existing = await prisma.article.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Artikel tidak ditemukan." };
    }

    await prisma.article.delete({
      where: { id },
    });

    await recordAuditLog({
      action: "ARTICLE_DELETE",
      targetType: "ARTICLE",
      targetId: existing.id,
      targetName: existing.title,
      details: {
        slug: existing.slug,
        category: existing.category,
      },
    });

    safeRevalidate("/admin/articles");
    safeRevalidate("/blog");

    return {
      success: true,
      message: `Artikel "${existing.title}" berhasil dihapus.`,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || "Gagal menghapus artikel." };
  }
}
