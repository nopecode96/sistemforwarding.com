"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AdminArticleItem,
  GetAdminArticlesResponse,
  toggleArticlePublish,
  deleteAdminArticle,
} from "@/actions/adminArticleActions";
import {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  FileText,
  Filter,
} from "lucide-react";
import { ArticleEditModal } from "./ArticleEditModal";

interface ArticleManagementViewProps {
  initialData: GetAdminArticlesResponse;
}

export function ArticleManagementView({ initialData }: ArticleManagementViewProps) {
  const [articles, setArticles] = useState<AdminArticleItem[]>(initialData.articles);
  const [stats, setStats] = useState(initialData.stats);
  const [categories] = useState<string[]>(initialData.categories);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<AdminArticleItem | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (article: AdminArticleItem) => {
    setEditingArticle(article);
    setIsModalOpen(true);
  };

  const handleSavedArticle = (saved: AdminArticleItem) => {
    setArticles((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    // Recalculate stats
    setStats((prev) => {
      const isNew = !articles.some((a) => a.id === saved.id);
      const wasPublished = articles.find((a) => a.id === saved.id)?.isPublished;
      if (isNew) {
        return {
          total: prev.total + 1,
          published: saved.isPublished ? prev.published + 1 : prev.published,
          drafts: !saved.isPublished ? prev.drafts + 1 : prev.drafts,
        };
      } else {
        let pubDiff = 0;
        let draftDiff = 0;
        if (wasPublished !== saved.isPublished) {
          pubDiff = saved.isPublished ? 1 : -1;
          draftDiff = saved.isPublished ? -1 : 1;
        }
        return {
          total: prev.total,
          published: prev.published + pubDiff,
          drafts: prev.drafts + draftDiff,
        };
      }
    });

    setNotification({
      type: "success",
      message: `Artikel "${saved.title}" berhasil disimpan.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTogglePublish = (article: AdminArticleItem) => {
    const nextPublished = !article.isPublished;
    startTransition(async () => {
      const res = await toggleArticlePublish(article.id, nextPublished);
      if (res.success) {
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? { ...a, isPublished: nextPublished } : a))
        );
        setStats((prev) => ({
          total: prev.total,
          published: nextPublished ? prev.published + 1 : prev.published - 1,
          drafts: nextPublished ? prev.drafts - 1 : prev.drafts + 1,
        }));
        setNotification({
          type: "success",
          message: res.message || "Status publish berhasil diubah.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Gagal mengubah status publish.",
        });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  const handleDeleteArticle = (article: AdminArticleItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus artikel "${article.title}"?`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteAdminArticle(article.id);
      if (res.success) {
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
        setStats((prev) => ({
          total: prev.total - 1,
          published: article.isPublished ? prev.published - 1 : prev.published,
          drafts: !article.isPublished ? prev.drafts - 1 : prev.drafts,
        }));
        setNotification({
          type: "success",
          message: res.message || "Artikel berhasil dihapus.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Gagal menghapus artikel.",
        });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  const getPublicBlogUrl = (slug: string) => {
    if (typeof window === "undefined") return `/blog/${slug}`;
    const host = window.location.host;
    if (host.startsWith("admin.")) {
      const mainHost = host.replace(/^admin\./, "");
      return `${window.location.protocol}//${mainHost}/blog/${slug}`;
    }
    return `/blog/${slug}`;
  };

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSearch =
          article.title.toLowerCase().includes(q) ||
          article.summary.toLowerCase().includes(q) ||
          article.slug.toLowerCase().includes(q) ||
          article.author.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Category
      if (selectedCategory !== "ALL" && article.category !== selectedCategory) {
        return false;
      }

      // Status
      if (statusFilter === "PUBLISHED" && !article.isPublished) return false;
      if (statusFilter === "DRAFT" && article.isPublished) return false;

      return true;
    });
  }, [articles, search, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg transition-all animate-in fade-in slide-in-from-top-4 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-semibold">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              CMS Artikel &amp; Knowledge Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Fase 4
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola artikel edukasi, SEO logistik freight forwarding, dan wawasan operasional platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/blog"
            target="_blank"
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Lihat Blog Publik</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-px"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Artikel Baru</span>
          </button>
        </div>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Artikel</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              {stats.total}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Artikel Terbit (Live)</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.published}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Draft / Internal</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats.drafts}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan judul, slug, penulis, ringkasan..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Semua ({articles.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PUBLISHED")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === "PUBLISHED"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Terbit ({stats.published})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DRAFT")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === "DRAFT"
                  ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Draft ({stats.drafts})
            </button>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Artikel &amp; Cuplikan</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Penulis</th>
                <th className="py-3.5 px-4">Status &amp; Terbit</th>
                <th className="py-3.5 px-4 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Tidak ada artikel yang cocok dengan filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr
                    key={article.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Title + Thumbnail */}
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3.5 max-w-md">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 relative border border-zinc-200 dark:border-zinc-700">
                          {article.coverImage ? (
                            <Image
                              src={article.coverImage}
                              alt={article.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <BookOpen className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h2 className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 hover:text-blue-600 transition-colors">
                            {article.title}
                          </h2>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 font-normal">
                            {article.summary}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 truncate block max-w-[200px]">
                              /blog/{article.slug}
                            </span>
                            <span className="text-[10px] text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.readTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                        {article.category}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{article.author}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 max-w-[150px] truncate">
                          {article.authorRole}
                        </p>
                      </div>
                    </td>

                    {/* Status & Date */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            article.isPublished
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              article.isPublished ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {article.isPublished ? "Published" : "Draft"}
                        </span>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {new Date(article.publishedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Publish button */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleTogglePublish(article)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                            article.isPublished
                              ? "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          }`}
                          title={article.isPublished ? "Ubah ke Draft" : "Publikasikan Sekarang"}
                        >
                          {article.isPublished ? "Unpublish" : "Publish"}
                        </button>

                        {/* View live article */}
                        <a
                          href={getPublicBlogUrl(article.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Lihat Halaman Publik"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(article)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Edit Artikel"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDeleteArticle(article)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Hapus Artikel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Article Modal */}
      <ArticleEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        article={editingArticle}
        onSaved={handleSavedArticle}
        existingCategories={categories}
      />
    </div>
  );
}
