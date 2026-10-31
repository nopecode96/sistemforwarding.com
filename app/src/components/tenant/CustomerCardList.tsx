"use client";

import { useState, useTransition, useMemo } from "react";
import { SearchableSelect, SearchOption } from "@/components/ui/SearchableSelect";
import {
  Building2,
  Plus,
  Search,
  CreditCard,
  Calendar,
  MapPin,
  Mail,
  Phone,
  User,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  DollarSign,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import {
  createTenantCustomer,
  updateTenantCustomer,
  deleteTenantCustomer,
  CustomerFormData,
} from "@/actions/masterCustomerActions";

interface GeographicalHierarchy {
  id: string;
  name: string;
  cities: Array<{
    id: string;
    name: string;
    type: string;
    districts: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

interface CustomerItem {
  id: string;
  customerCode: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  provinceId: string | null;
  provinceName: string | null;
  cityId: string | null;
  cityName: string | null;
  districtId: string | null;
  districtName: string | null;
  postalCode: string;
  taxId: string;
  paymentTermDays: number;
  creditLimit: number;
  isActive: boolean;
  createdAt: string;
}

interface CustomerCardListProps {
  tenantSubdomain: string;
  initialCustomers: CustomerItem[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  geoHierarchy: GeographicalHierarchy[];
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CustomerCardList({
  tenantSubdomain,
  initialCustomers,
  initialPagination,
  geoHierarchy,
}: CustomerCardListProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CustomerFormData>({
    customerCode: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    provinceId: "",
    cityId: "",
    districtId: "",
    postalCode: "",
    taxId: "",
    paymentTermDays: 30,
    creditLimit: 0,
    isActive: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Client filtering
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      c.taxId.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      (c.cityName && c.cityName.toLowerCase().includes(q))
    );
  });

  // Client-side pagination over filtered results
  const itemsPerPage = 6;
  const totalFilteredPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle province change to reset city & district
  const handleProvinceChange = (provinceId: string) => {
    setFormData((prev) => ({
      ...prev,
      provinceId,
      cityId: "",
      districtId: "",
    }));
  };

  // Handle city change to reset district
  const handleCityChange = (cityId: string) => {
    setFormData((prev) => ({
      ...prev,
      cityId,
      districtId: "",
    }));
  };

  // Selected Province & City for dynamic cascading
  const selectedProvince = geoHierarchy.find((p) => p.id === formData.provinceId);
  const availableCities = selectedProvince ? selectedProvince.cities : [];
  const selectedCity = availableCities.find((c) => c.id === formData.cityId);
  const availableDistricts = selectedCity ? selectedCity.districts : [];

  const provinceOptions: SearchOption[] = useMemo(
    () =>
      geoHierarchy.map((prov) => ({
        value: prov.id,
        label: prov.name,
        badge: "Provinsi",
        badgeColor: "blue",
        category: "Provinsi Indonesia",
      })),
    [geoHierarchy]
  );

  const cityOptions: SearchOption[] = useMemo(
    () =>
      availableCities.map((city) => ({
        value: city.id,
        label: city.name,
        badge: "Kota/Kab",
        badgeColor: "emerald",
        category: selectedProvince ? selectedProvince.name : "Kota / Kabupaten",
      })),
    [availableCities, selectedProvince]
  );

  const districtOptions: SearchOption[] = useMemo(
    () =>
      availableDistricts.map((dist) => ({
        value: dist.id,
        label: dist.name,
        badge: "Kecamatan",
        badgeColor: "violet",
        category: selectedCity ? selectedCity.name : "Kecamatan",
      })),
    [availableDistricts, selectedCity]
  );

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedCustomerId(null);
    setFormData({
      customerCode: "",
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      provinceId: geoHierarchy.length > 0 ? geoHierarchy[0].id : "",
      cityId: geoHierarchy.length > 0 && geoHierarchy[0].cities.length > 0 ? geoHierarchy[0].cities[0].id : "",
      districtId: "",
      postalCode: "",
      taxId: "",
      paymentTermDays: 30,
      creditLimit: 250000000,
      isActive: true,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (customer: CustomerItem) => {
    setModalMode("edit");
    setSelectedCustomerId(customer.id);
    setFormData({
      customerCode: customer.customerCode,
      name: customer.name,
      contactPerson: customer.contactPerson !== "-" ? customer.contactPerson : "",
      email: customer.email !== "-" ? customer.email : "",
      phone: customer.phone !== "-" ? customer.phone : "",
      address: customer.address !== "-" ? customer.address : "",
      provinceId: customer.provinceId || "",
      cityId: customer.cityId || "",
      districtId: customer.districtId || "",
      postalCode: customer.postalCode !== "-" ? customer.postalCode : "",
      taxId: customer.taxId !== "-" ? customer.taxId : "",
      paymentTermDays: customer.paymentTermDays,
      creditLimit: customer.creditLimit,
      isActive: customer.isActive,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Save Customer (Create or Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    startTransition(async () => {
      try {
        if (modalMode === "create") {
          const res = await createTenantCustomer(tenantSubdomain, formData);
          if (!res.success) {
            setFormError(res.error || "Gagal menyimpan customer.");
            return;
          }

          setFormSuccess(res.message || "Customer berhasil ditambahkan!");
          // Add to local state
          const newCust: CustomerItem = {
            id: res.customerId || `cust-${Date.now()}`,
            customerCode: formData.customerCode || "CUST-NEW",
            name: formData.name,
            contactPerson: formData.contactPerson || "-",
            email: formData.email || "-",
            phone: formData.phone || "-",
            address: formData.address || "-",
            provinceId: formData.provinceId || null,
            provinceName: selectedProvince?.name || null,
            cityId: formData.cityId || null,
            cityName: selectedCity?.name || null,
            districtId: formData.districtId || null,
            districtName: availableDistricts.find((d) => d.id === formData.districtId)?.name || null,
            postalCode: formData.postalCode || "-",
            taxId: formData.taxId || "-",
            paymentTermDays: Number(formData.paymentTermDays) || 30,
            creditLimit: Number(formData.creditLimit) || 0,
            isActive: formData.isActive ?? true,
            createdAt: new Date().toISOString(),
          };
          setCustomers((prev) => [newCust, ...prev]);

          setTimeout(() => {
            setIsModalOpen(false);
          }, 1000);
        } else if (modalMode === "edit" && selectedCustomerId) {
          const res = await updateTenantCustomer(tenantSubdomain, selectedCustomerId, formData);
          if (!res.success) {
            setFormError(res.error || "Gagal memperbarui customer.");
            return;
          }

          setFormSuccess(res.message || "Customer berhasil diperbarui!");
          // Update in local state
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === selectedCustomerId
                ? {
                    ...c,
                    name: formData.name,
                    customerCode: formData.customerCode || c.customerCode,
                    contactPerson: formData.contactPerson || "-",
                    email: formData.email || "-",
                    phone: formData.phone || "-",
                    address: formData.address || "-",
                    provinceId: formData.provinceId || null,
                    provinceName: selectedProvince?.name || c.provinceName,
                    cityId: formData.cityId || null,
                    cityName: selectedCity?.name || c.cityName,
                    districtId: formData.districtId || null,
                    districtName:
                      availableDistricts.find((d) => d.id === formData.districtId)?.name ||
                      c.districtName,
                    postalCode: formData.postalCode || "-",
                    taxId: formData.taxId || "-",
                    paymentTermDays: Number(formData.paymentTermDays) || 30,
                    creditLimit: Number(formData.creditLimit) || 0,
                    isActive: formData.isActive ?? true,
                  }
                : c
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

  // Delete Customer
  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus pelanggan "${name}" dari sistem?`)) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await deleteTenantCustomer(tenantSubdomain, id);
        if (res.success) {
          setCustomers((prev) => prev.filter((c) => c.id !== id));
        } else {
          alert(res.error || "Gagal menghapus pelanggan.");
        }
      } catch (err) {
        alert("Gagal menghapus pelanggan.");
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#121620] p-4 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama pelanggan, kode, NPWP, atau kota..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/${tenantSubdomain}/export/customers`}
            download
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 shadow-2xs transition-all"
            title="Download Excel Semua Customer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Download Excel</span>
          </a>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Customer Baru</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE-FIRST CARD-BASED LIST (STRICTLY NO HTML <table> AS PER RULE) */}
      {/* ==================================================================== */}
      {paginatedCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
          <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak Ada Data Pelanggan Ditemukan
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `Tidak ada hasil yang sesuai dengan kata kunci "${searchQuery}".`
              : "Belum ada master data pelanggan yang tersimpan. Klik tombol di atas untuk mendaftarkan pelanggan pertama."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paginatedCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-xs hover:border-violet-500/30 transition-all space-y-4"
            >
              {/* Card Header: Name, Customer Code, and Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600/10 to-indigo-600/10 dark:from-violet-500/20 dark:to-indigo-500/20 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold text-xs shrink-0 border border-violet-500/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {customer.name}
                      </h4>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {customer.customerCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Ruang Kerja: <span className="font-mono text-violet-600 dark:text-violet-400">{tenantSubdomain}.sistemforwarding.com</span>
                    </p>
                  </div>
                </div>

                {/* Status Pill Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                      customer.isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/30"
                        : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        customer.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {customer.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>

              {/* Card Body: Key Fields Grid (NPWP, TOP, Credit Limit, Wilayah, PIC) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* NPWP / Tax ID */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    <span>NPWP / Tax ID</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                    {customer.taxId || "Belum Terdaftar"}
                  </p>
                </div>

                {/* Term of Payment (TOP) */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                    <span>Term of Payment (TOP)</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {customer.paymentTermDays} Hari Kalender
                  </p>
                </div>

                {/* Batas Limit Piutang / Plafon */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Plafon Limit Piutang</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(customer.creditLimit)}
                  </p>
                </div>

                {/* Wilayah / Lokasi */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span>Wilayah / Domisili</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={`${customer.cityName || ""}, ${customer.provinceName || ""}`}>
                    {customer.cityName || customer.provinceName
                      ? `${customer.cityName ? customer.cityName + ", " : ""}${customer.provinceName || ""}`
                      : customer.address || "-"}
                  </p>
                </div>
              </div>

              {/* Card Contact Info Strip */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>PIC: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{customer.contactPerson}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
              </div>

              {/* Card Footer Actions: Edit & Hapus */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => openEditModal(customer)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Customer</span>
                </button>
                <button
                  type="button"
                  disabled={deletingId === customer.id || isPending}
                  onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                >
                  {deletingId === customer.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================================== */}
      {/* CARD LIST PAGINATION CONTROLS */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Menampilkan <strong className="text-slate-900 dark:text-white">{filteredCustomers.length}</strong> pelanggan terdaftar
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

          {/* Page Number Pills */}
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
      {/* MODAL: TAMBAH / EDIT CUSTOMER */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#121620] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {modalMode === "create" ? "Tambah Pelanggan Baru" : "Edit Data Pelanggan"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Master referensi penjualan (AR) terisolasi untuk ruang kerja {tenantSubdomain}.
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

            {/* Error / Success Alerts */}
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

            {/* Form */}
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kode Customer */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kode Pelanggan (Opsional / Otomatis)
                  </label>
                  <input
                    type="text"
                    value={formData.customerCode}
                    onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                    placeholder="Contoh: CUST-004"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                </div>

                {/* Nama Customer */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Perusahaan / Shipper <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="PT Sumber Ekspor Sejahtera"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                  />
                </div>

                {/* NPWP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    NPWP / Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="01.234.567.8-012.000"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                </div>

                {/* Term of Payment (TOP) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Term of Payment (Jatuh Tempo)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={formData.paymentTermDays}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentTermDays: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      Hari
                    </span>
                  </div>
                </div>

                {/* Plafon Limit Piutang */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Batas Plafon Kredit (IDR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000000}
                    value={formData.creditLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, creditLimit: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                </div>

                {/* Status Aktif */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status Operasional
                  </label>
                  <select
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === "true" })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="true">Aktif (Dapat dipilih di Job File)</option>
                    <option value="false">Nonaktif (Arsip)</option>
                  </select>
                </div>
              </div>

              {/* Geographical Hierarchy Dropdowns */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Data Referensi Wilayah Geografis Indonesia
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Provinsi */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Provinsi
                    </label>
                    <SearchableSelect
                      name="provinceId"
                      value={formData.provinceId || ""}
                      onChange={(val) => handleProvinceChange(val)}
                      options={provinceOptions}
                      placeholder="Pilih Provinsi..."
                      searchPlaceholder="Cari provinsi..."
                    />
                  </div>

                  {/* Kota */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Kota / Kabupaten
                    </label>
                    <SearchableSelect
                      name="cityId"
                      value={formData.cityId || ""}
                      onChange={(val) => handleCityChange(val)}
                      disabled={availableCities.length === 0}
                      options={cityOptions}
                      placeholder="Pilih Kota/Kab..."
                      searchPlaceholder="Cari kota..."
                      emptyMessage="Pilih provinsi terlebih dahulu"
                    />
                  </div>

                  {/* Kecamatan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Kecamatan
                    </label>
                    <SearchableSelect
                      name="districtId"
                      value={formData.districtId || ""}
                      onChange={(val) => setFormData((prev) => ({ ...prev, districtId: val }))}
                      disabled={availableDistricts.length === 0}
                      options={districtOptions}
                      placeholder="Pilih Kecamatan..."
                      searchPlaceholder="Cari kecamatan..."
                      emptyMessage="Pilih kota terlebih dahulu"
                    />
                  </div>
                </div>
              </div>

              {/* Alamat & Kontak PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Alamat Lengkap Kantor / Gudang
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Jl. Raya Pelabuhan No. 12, Tanjung Priok..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama PIC / Kontak
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Budi Setiawan"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Kontak
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="budi@domain.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    No. Telepon / WA
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
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
                  <span>{modalMode === "create" ? "Simpan Pelanggan" : "Perbarui Data"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
