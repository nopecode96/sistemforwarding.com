"use client";

import { useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  Wallet,
  Ship,
  BarChart3,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCheck,
} from "lucide-react";
import {
  createTenantUser,
  updateTenantUser,
  toggleTenantUserStatus,
  deleteTenantUser,
  UserFormData,
} from "@/actions/userManagementActions";
import { UserRole } from "@prisma/client";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

interface UserCardListProps {
  tenantSubdomain: string;
  companyName: string;
  initialUsers: UserItem[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function UserCardList({
  tenantSubdomain,
  companyName,
  initialUsers,
  initialPagination,
}: UserCardListProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    role: UserRole.OPERATOR,
    isActive: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Filtering
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery.trim() ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Client-side pagination
  const itemsPerPage = 6;
  const totalFilteredPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUserId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: UserRole.OPERATOR,
      isActive: true,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (user: UserItem) => {
    setModalMode("edit");
    setSelectedUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone !== "-" ? user.phone : "",
      role: user.role,
      isActive: user.isActive,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Save User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    startTransition(async () => {
      try {
        if (modalMode === "create") {
          const res = await createTenantUser(tenantSubdomain, formData);
          if (!res.success) {
            setFormError(res.error || "Gagal membuat pengguna.");
            return;
          }

          setFormSuccess(res.message || "Pengguna berhasil ditambahkan!");
          const newUser: UserItem = {
            id: res.userId || `user-${Date.now()}`,
            name: formData.name,
            email: formData.email,
            phone: formData.phone || "-",
            role: formData.role,
            isActive: formData.isActive ?? true,
            createdAt: new Date().toISOString(),
          };
          setUsers((prev) => [newUser, ...prev]);

          setTimeout(() => {
            setIsModalOpen(false);
          }, 1000);
        } else if (modalMode === "edit" && selectedUserId) {
          const res = await updateTenantUser(tenantSubdomain, selectedUserId, formData);
          if (!res.success) {
            setFormError(res.error || "Gagal memperbarui pengguna.");
            return;
          }

          setFormSuccess(res.message || "Pengguna berhasil diperbarui!");
          setUsers((prev) =>
            prev.map((u) =>
              u.id === selectedUserId
                ? {
                    ...u,
                    name: formData.name,
                    phone: formData.phone || "-",
                    role: formData.role,
                    isActive: formData.isActive ?? true,
                  }
                : u
            )
          );

          setTimeout(() => {
            setIsModalOpen(false);
          }, 1000);
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Terjadi kesalahan internal.");
      }
    });
  };

  // Toggle User Active Status
  const handleToggleStatus = (id: string) => {
    setActionInProgressId(id);
    startTransition(async () => {
      try {
        const res = await toggleTenantUserStatus(tenantSubdomain, id);
        if (res.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u))
          );
        } else {
          alert(res.error || "Gagal mengubah status pengguna.");
        }
      } catch (err) {
        alert("Gagal mengubah status.");
      } finally {
        setActionInProgressId(null);
      }
    });
  };

  // Delete User
  const handleDeleteUser = (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin mencabut akses pengguna "${name}"?`)) {
      return;
    }

    setActionInProgressId(id);
    startTransition(async () => {
      try {
        const res = await deleteTenantUser(tenantSubdomain, id);
        if (res.success) {
          setUsers((prev) => prev.filter((u) => u.id !== id));
        } else {
          alert(res.error || "Gagal menghapus pengguna.");
        }
      } catch (err) {
        alert("Gagal menghapus pengguna.");
      } finally {
        setActionInProgressId(null);
      }
    });
  };

  // Render role badge helper
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.TENANT_ADMIN:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs">
            <Shield className="h-3 w-3" />
            <span>Tenant Admin</span>
          </span>
        );
      case UserRole.FINANCE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30">
            <Wallet className="h-3 w-3 text-emerald-600" />
            <span>Finance &amp; Invoicing</span>
          </span>
        );
      case UserRole.OPERATOR:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-500/30">
            <Ship className="h-3 w-3 text-blue-600" />
            <span>Operator Kargo</span>
          </span>
        );
      case UserRole.MANAGEMENT:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30">
            <BarChart3 className="h-3 w-3 text-amber-600" />
            <span>Management</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Role Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#121620] p-4 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama anggota tim, email, atau telepon..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Role Selector & Add Button */}
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="ALL">Semua Peran (Role)</option>
            <option value="TENANT_ADMIN">Tenant Admin</option>
            <option value="OPERATOR">Operator Kargo</option>
            <option value="FINANCE">Finance &amp; Akuntansi</option>
            <option value="MANAGEMENT">Management</option>
          </select>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 transition-all shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE-FIRST CARD-BASED USER LIST (STRICTLY NO HTML <table> AS PER RULE) */}
      {/* ==================================================================== */}
      {paginatedUsers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak Ada Pengguna Ditemukan
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `Tidak ada anggota tim yang cocok dengan kata kunci "${searchQuery}".`
              : "Belum ada pengguna tambahan. Daftarkan staf operasional atau akuntan Anda."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paginatedUsers.map((user) => {
            const initials =
              user.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0].toUpperCase())
                .join("") || "US";

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-xs hover:border-violet-500/30 transition-all space-y-4"
              >
                {/* Header: User Avatar, Name, Email, Role, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {user.name}
                        </h4>
                        {renderRoleBadge(user.role)}
                      </div>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        user.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/30"
                          : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      {user.isActive ? "Akses Aktif" : "Dinonaktifkan"}
                    </span>
                  </div>
                </div>

                {/* Body: Metadata Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                      <Phone className="h-3.5 w-3.5 text-blue-500" />
                      <span>No. WhatsApp / Kontak</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {user.phone || "Tidak Ada Data"}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                      <Shield className="h-3.5 w-3.5 text-violet-500" />
                      <span>Cakupan Otoritas</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {user.role === UserRole.TENANT_ADMIN
                        ? "Otoritas Penuh Ruang Kerja"
                        : user.role === UserRole.FINANCE
                        ? "Akses Keuangan & Ledger"
                        : user.role === UserRole.OPERATOR
                        ? "Akses Job File & Kargo"
                        : "Laporan Eksekutif"}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Terdaftar Sejak</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    disabled={actionInProgressId === user.id}
                    onClick={() => handleToggleStatus(user.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{user.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Ubah Peran</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionInProgressId === user.id || isPending}
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    {actionInProgressId === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>Cabut Akses</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* PAGINATION CONTROLS */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Menampilkan <strong className="text-slate-900 dark:text-white">{filteredUsers.length}</strong> anggota tim
          (Halaman <strong>{currentPage}</strong> dari <strong>{totalFilteredPages}</strong>)
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`h-7 w-7 rounded-xl text-xs font-bold transition-all ${
                  currentPage === p
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalFilteredPages}
            onClick={() => setCurrentPage((p) => Math.min(totalFilteredPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: TAMBAH / EDIT USER */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#121620] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {modalMode === "create" ? "Undang Pengguna Baru" : "Edit Hak Akses Pengguna"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Pemberian hak akses terikat pada tenant {tenantSubdomain}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/30 flex items-center gap-2.5 text-xs text-red-600 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Raditya Pratama"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alamat Email (Akun Login) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={modalMode === "edit"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="raditya@sistemforwarding.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="081298765432"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Peran &amp; Hak Akses (RBAC) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                >
                  <option value={UserRole.OPERATOR}>OPERATOR - Input Job File, Muatan Laut/Udara &amp; BL</option>
                  <option value={UserRole.FINANCE}>FINANCE - Invoicing Tagihan, Pembayaran &amp; PPN</option>
                  <option value={UserRole.TENANT_ADMIN}>TENANT_ADMIN - Kontrol Penuh Pengaturan &amp; Master Data</option>
                  <option value={UserRole.MANAGEMENT}>MANAGEMENT - Laporan Kinerja &amp; Telemetri Margin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Akun
                </label>
                <select
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.value === "true" })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="true">Aktif (Dapat Login ke Ruang Kerja)</option>
                  <option value="false">Nonaktif (Akses Dicabut Sementara)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 disabled:opacity-50 transition-all"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{modalMode === "create" ? "Simpan Anggota Tim" : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
