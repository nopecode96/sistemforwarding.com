"use client";

import { useState, useTransition } from "react";
import {
  AdminArticleItem,
  upsertAdminArticle,
  ArticleActionResult,
  ArticleSection,
} from "@/actions/adminArticleActions";
import { X, Plus, Trash2, AlertCircle, BookOpen, Sparkles, Image as ImageIcon } from "lucide-react";

interface ArticleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: AdminArticleItem | null;
  onSaved: (savedArticle: AdminArticleItem) => void;
  existingCategories: string[];
}

interface ArticleEditFormProps {
  article: AdminArticleItem | null;
  onClose: () => void;
  onSaved: (savedArticle: AdminArticleItem) => void;
  existingCategories: string[];
}

interface FormSection {
  heading: string;
  bodyText: string;
  callout?: string;
}

function ArticleEditForm({
  article,
  onClose,
  onSaved,
  existingCategories,
}: ArticleEditFormProps) {
  const isEditing = Boolean(article?.id);

  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [category, setCategory] = useState(article?.category || "Teknologi TMS");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [summary, setSummary] = useState(article?.summary || "");
  const [coverImage, setCoverImage] = useState(
    article?.coverImage || "/blog/cloud-tms.jpg"
  );
  const [author, setAuthor] = useState(
    article?.author || "Tim Redaksi Sistem Forwarding"
  );
  const [authorRole, setAuthorRole] = useState(
    article?.authorRole || "Spesialis TMS & Regulasi Logistik"
  );
  const [readTime, setReadTime] = useState(article?.readTime || "5 menit baca");
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? true);

  // Content structure
  const [intro, setIntro] = useState(article?.content?.intro || "");
  const [takeaways, setTakeaways] = useState<string[]>(
    article?.content?.takeaways?.length
      ? article.content.takeaways
      : [
          "Otomatisasi Job File mencegah kebocoran margin laba operasional.",
          "Keamanan multi-tenant menjamin kerahasiaan data freight forwarder.",
        ]
  );
  const [newTakeaway, setNewTakeaway] = useState("");

  const [sections, setSections] = useState<FormSection[]>(
    article?.content?.sections?.length
      ? article.content.sections.map((s) => ({
          heading: s.heading,
          bodyText: Array.isArray(s.body) ? s.body.join("\n\n") : "",
          callout: s.callout,
        }))
      : [
          {
            heading: "1. Transformasi Digital Forwarding Modern",
            bodyText:
              "Perkembangan industri logistik dan kargo menuntut pencatatan yang terintegrasi secara langsung antar-divisi.\n\nPenggunaan sistem cloud multi-tenant memangkas waktu rekonsiliasi faktur dan pelacakan BL secara drastis.",
            callout: "Catatan: Integrasi real-time meningkatkan produktivitas tim operasional hingga 60%.",
          },
        ]
  );

  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddTakeaway = () => {
    if (!newTakeaway.trim()) return;
    setTakeaways([...takeaways, newTakeaway.trim()]);
    setNewTakeaway("");
  };

  const handleRemoveTakeaway = (index: number) => {
    setTakeaways(takeaways.filter((_, i) => i !== index));
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        heading: `${sections.length + 1}. Sub-bagian Baru`,
        bodyText: "Tuliskan isi paragraf penjelasan di sini.",
      },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleUpdateSectionHeading = (index: number, val: string) => {
    const updated = [...sections];
    updated[index].heading = val;
    setSections(updated);
  };

  const handleUpdateSectionBody = (index: number, val: string) => {
    const updated = [...sections];
    updated[index].bodyText = val;
    setSections(updated);
  };

  const handleUpdateSectionCallout = (index: number, val: string) => {
    const updated = [...sections];
    updated[index].callout = val.trim() ? val : undefined;
    setSections(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const finalCategory = isCustomCategory
      ? customCategory.trim()
      : category.trim();

    if (!title.trim()) {
      setErrorMsg("Judul artikel wajib diisi.");
      return;
    }
    if (!finalCategory) {
      setErrorMsg("Kategori artikel wajib dipilih atau diisi.");
      return;
    }
    if (!summary.trim()) {
      setErrorMsg("Ringkasan singkat artikel wajib diisi.");
      return;
    }
    if (!author.trim()) {
      setErrorMsg("Nama penulis wajib diisi.");
      return;
    }

    startTransition(async () => {
      const formattedSections: ArticleSection[] = sections.map((s) => ({
        heading: s.heading.trim(),
        body: s.bodyText
          .split("\n\n")
          .map((p) => p.trim())
          .filter(Boolean),
        callout: s.callout?.trim() ? s.callout.trim() : undefined,
      }));

      const res: ArticleActionResult<AdminArticleItem> = await upsertAdminArticle({
        id: article?.id,
        slug: slug.trim() || undefined,
        title: title.trim(),
        category: finalCategory,
        summary: summary.trim(),
        coverImage: coverImage.trim() || null,
        author: author.trim(),
        authorRole: authorRole.trim(),
        readTime: readTime.trim() || undefined,
        isPublished,
        content: {
          intro: intro.trim(),
          sections: formattedSections,
          takeaways: takeaways.filter(Boolean),
        },
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyimpan artikel.");
      } else if (res.data) {
        onSaved(res.data);
        onClose();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {isEditing ? "Edit Artikel CMS" : "Buat Artikel Baru"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Publikasikan wawasan logistik & edukasi freight forwarding.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body / Scrollable Content */}
      <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 text-xs">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2.5 text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-200 text-sm border-b border-zinc-200 dark:border-zinc-800 pb-2 flex items-center gap-2">
            <span>1. Informasi Utama Artikel</span>
          </h3>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Judul Artikel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Mengapa Perusahaan Forwarding Wajib Beralih ke Cloud TMS"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kategori Artikel <span className="text-red-500">*</span>
              </label>
              {!isCustomCategory ? (
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") {
                        setIsCustomCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    {!existingCategories.includes(category) && (
                      <option value={category}>{category}</option>
                    )}
                    <option value="__NEW__">+ Tambah Kategori Baru...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ketik kategori baru..."
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(false)}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-xl"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Slug URL (Opsional / Otomatis)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Kosongkan untuk auto-generate dari judul"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Ringkasan Singkat (Lead / Meta Description) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ringkasan eksekutif 2-3 kalimat untuk cuplikan pencarian Google dan thumbnail..."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Penulis (Author) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nama Penulis"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Jabatan / Kredensial Penulis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="Contoh: Head of Operations"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Estimasi Waktu Baca
              </label>
              <input
                type="text"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="Contoh: 5 menit baca"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                URL Gambar Sampul (Cover Image)
              </label>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="/blog/cloud-tms.jpg atau URL eksternal"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                    Publikasikan Langsung (Published)
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Bila dimatikan, artikel tersimpan sebagai draft internal.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Takeaways */}
        <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-200 text-sm flex items-center gap-2">
              <span>💡 Poin Kunci &amp; Ringkasan Eksekutif (Takeaways)</span>
            </h3>
          </div>

          <div className="space-y-2">
            {takeaways.map((point, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl"
              >
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  ✓
                </span>
                <span className="flex-1 text-zinc-800 dark:text-zinc-200">{point}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTakeaway(idx)}
                  className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newTakeaway}
                onChange={(e) => setNewTakeaway(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTakeaway();
                  }
                }}
                placeholder="Tambahkan poin kunci..."
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTakeaway}
                className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Intro Paragraph */}
        <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-200 text-sm">
            Paragraf Pengantar (Intro)
          </h3>
          <textarea
            rows={3}
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="Paragraf pengantar yang membuka konteks pembahasan..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Section 4: Content Sections */}
        <div className="space-y-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-200 text-sm flex items-center gap-2">
              <span>Bagian Konten Artikel ({sections.length} Bagian)</span>
            </h3>
            <button
              type="button"
              onClick={handleAddSection}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Sub-Bagian</span>
            </button>
          </div>

          <div className="space-y-4">
            {sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => handleUpdateSectionHeading(sIdx, e.target.value)}
                    placeholder="Judul Sub-Bagian (H2)"
                    className="flex-1 font-bold text-zinc-900 dark:text-zinc-100 px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIdx)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Hapus Bagian Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                    Isi Paragraf (Pisahkan antar paragraf dengan 2x Enter / baris baru kosong)
                  </label>
                  <textarea
                    rows={4}
                    value={section.bodyText}
                    onChange={(e) => handleUpdateSectionBody(sIdx, e.target.value)}
                    placeholder="Tulis paragraf narasi di sini..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                    Callout Highlight (Opsional)
                  </label>
                  <input
                    type="text"
                    value={section.callout || ""}
                    onChange={(e) => handleUpdateSectionCallout(sIdx, e.target.value)}
                    placeholder="Catatan penting atau tips regulasi yang disorot..."
                    className="w-full px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/30">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-semibold transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{isEditing ? "Simpan Perubahan" : "Terbitkan Artikel"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function ArticleEditModal({
  isOpen,
  onClose,
  article,
  onSaved,
  existingCategories,
}: ArticleEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <ArticleEditForm
          article={article}
          onClose={onClose}
          onSaved={onSaved}
          existingCategories={existingCategories}
        />
      </div>
    </div>
  );
}
