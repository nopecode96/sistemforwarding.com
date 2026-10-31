"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Truck,
  Ship,
  Plane,
  ShieldCheck,
  Layers,
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
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  DollarSign,
  Loader2,
  Landmark,
  FileSpreadsheet,
} from "lucide-react";
import {
  createTenantVendor,
  updateTenantVendor,
  deleteTenantVendor,
  VendorFormData,
} from "@/actions/masterVendorActions";
import { SearchableSelect, SearchOption } from "@/components/ui/SearchableSelect";
import { VendorCategory } from "@prisma/client";

interface GeographicalHierarchy {
  id: string;
  name: string;
  code?: string | null;
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

export interface VendorItem {
  id: string;
  vendorCode: string;
  name: string;
  category: VendorCategory;
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
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  isActive: boolean;
  createdAt: string;
}

interface VendorCardListProps {
  tenantSubdomain: string;
  initialVendors: VendorItem[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  geoHierarchy: GeographicalHierarchy[];
  categoryStats?: {
    sea: number;
    air: number;
    truck: number;
    broker: number;
    others: number;
  };
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const CATEGORY_CONFIG: Record<
  VendorCategory,
  { label: string; icon: any; color: "blue" | "violet" | "amber" | "emerald" | "slate" }
> = {
  CARRIER_SEA: { label: "Pelayaran Laut (Shipping Line)", icon: Ship, color: "blue" },
  CARRIER_AIR: { label: "Maskapai Udara (Airlines Cargo)", icon: Plane, color: "violet" },
  HAULAGE_TRUCK: { label: "Armada Truk (Haulage / Inland)", icon: Truck, color: "amber" },
  CUSTOMS_BROKER: { label: "PPJK & Kepabeanan (Customs)", icon: ShieldCheck, color: "emerald" },
  OTHERS: { label: "Vendor Pendukung Lainnya", icon: Layers, color: "slate" },
};

export function VendorCardList({
  tenantSubdomain,
  initialVendors,
  initialPagination,
  geoHierarchy,
  categoryStats,
}: VendorCardListProps) {
  const [vendors, setVendors] = useState<VendorItem[]>(initialVendors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<VendorFormData>({
    vendorCode: "",
    name: "",
    category: VendorCategory.CARRIER_SEA,
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
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolder: "",
    isActive: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered vendors (client-side interactive filter)
  const filteredVendors = vendors.filter((v) => {
    const matchesCat = selectedCategory === "ALL" || v.category === selectedCategory;
    if (!matchesCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.vendorCode.toLowerCase().includes(q) ||
      v.taxId.toLowerCase().includes(q) ||
      v.contactPerson.toLowerCase().includes(q) ||
      (v.cityName && v.cityName.toLowerCase().includes(q))
    );
  });

  // Client-side pagination over filtered results
  const itemsPerPage = 6;
  const totalFilteredPages = Math.ceil(filteredVendors.length / itemsPerPage) || 1;
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Geographic Cascading
  const selectedProvince = geoHierarchy.find((p) => p.id === formData.provinceId);
  const availableCities = selectedProvince ? selectedProvince.cities : [];
  const selectedCity = availableCities.find((c) => c.id === formData.cityId);
  const availableDistricts = selectedCity ? selectedCity.districts : [];

  const handleProvinceChange = (provinceId: string) => {
    setFormData((prev) => ({
      ...prev,
      provinceId,
      cityId: "",
      districtId: "",
    }));
  };

  const handleCityChange = (cityId: string) => {
    setFormData((prev) => ({
      ...prev,
      cityId,
      districtId: "",
    }));
  };

  const categoryOptions: SearchOption[] = [
    { value: "CARRIER_SEA", label: "Pelayaran Laut (Carrier Sea)", badge: "SEA", badgeColor: "blue", category: "Vendor Transportasi" },
    { value: "CARRIER_AIR", label: "Maskapai Udara (Carrier Air)", badge: "AIR", badgeColor: "violet", category: "Vendor Transportasi" },
    { value: "HAULAGE_TRUCK", label: "Armada Truk (Haulage Trucking)", badge: "TRUCK", badgeColor: "amber", category: "Vendor Transportasi" },
    { value: "CUSTOMS_BROKER", label: "PPJK & Kepabeanan (Customs Broker)", badge: "PPJK", badgeColor: "emerald", category: "Jasa Kepabeanan" },
    { value: "OTHERS", label: "Vendor Pendukung Lainnya", badge: "OTHERS", badgeColor: "slate", category: "Lainnya" },
  ];

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

  // Modal Handlers
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedVendorId(null);
    setFormData({
      vendorCode: "",
      name: "",
      category: VendorCategory.CARRIER_SEA,
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
      creditLimit: 200000000,
      bankName: "",
      bankAccountNumber: "",
      bankAccountHolder: "",
      isActive: true,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: VendorItem) => {
    setModalMode("edit");
    setSelectedVendorId(vendor.id);
    setFormData({
      vendorCode: vendor.vendorCode,
      name: vendor.name,
      category: vendor.category,
      contactPerson: vendor.contactPerson !== "-" ? vendor.contactPerson : "",
      email: vendor.email !== "-" ? vendor.email : "",
      phone: vendor.phone !== "-" ? vendor.phone : "",
      address: vendor.address !== "-" ? vendor.address : "",
      provinceId: vendor.provinceId || "",
      cityId: vendor.cityId || "",
      districtId: vendor.districtId || "",
      postalCode: vendor.postalCode !== "-" ? vendor.postalCode : "",
      taxId: vendor.taxId !== "-" ? vendor.taxId : "",
      paymentTermDays: vendor.paymentTermDays,
      creditLimit: vendor.creditLimit,
      bankName: vendor.bankName !== "-" ? vendor.bankName : "",
      bankAccountNumber: vendor.bankAccountNumber !== "-" ? vendor.bankAccountNumber : "",
      bankAccountHolder: vendor.bankAccountHolder !== "-" ? vendor.bankAccountHolder : "",
      isActive: vendor.isActive,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    startTransition(async () => {
      try {
        if (modalMode === "create") {
          const res = await createTenantVendor(tenantSubdomain, formData);
          if (!res.success) {
            setFormError(res.error || "Gagal menyimpan vendor.");
            return;
          }

          setFormSuccess(res.message || "Vendor berhasil didaftarkan!");
          const newVen: VendorItem = {
            id: res.vendorId || `vnd-${Date.now()}`,
            vendorCode: formData.vendorCode || "VND-NEW",
            name: formData.name,
            category: formData.category,
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
            bankName: formData.bankName || "-",
            bankAccountNumber: formData.bankAccountNumber || "-",
            bankAccountHolder: formData.bankAccountHolder || "-",
            isActive: formData.isActive ?? true,
            createdAt: new Date().toISOString(),
          };
          setVendors((prev) => [newVen, ...prev]);

          setTimeout(() => {
            setIsModalOpen(false);
          }, 900);
        } else if (modalMode === "edit" && selectedVendorId) {
          const res = await updateTenantVendor(tenantSubdomain, selectedVendorId, formData);
          if (!res.success) {
            setFormError(res.error || "Gagal memperbarui vendor.");
            return;
          }

          setFormSuccess(res.message || "Vendor berhasil diperbarui!");
          setVendors((prev) =>
            prev.map((v) =>
              v.id === selectedVendorId
                ? {
                    ...v,
                    name: formData.name,
                    vendorCode: formData.vendorCode || v.vendorCode,
                    category: formData.category,
                    contactPerson: formData.contactPerson || "-",
                    email: formData.email || "-",
                    phone: formData.phone || "-",
                    address: formData.address || "-",
                    provinceId: formData.provinceId || null,
                    provinceName: selectedProvince?.name || v.provinceName,
                    cityId: formData.cityId || null,
                    cityName: selectedCity?.name || v.cityName,
                    districtId: formData.districtId || null,
                    districtName: availableDistricts.find((d) => d.id === formData.districtId)?.name || v.districtName,
                    postalCode: formData.postalCode || "-",
                    taxId: formData.taxId || "-",
                    paymentTermDays: Number(formData.paymentTermDays) || 30,
                    creditLimit: Number(formData.creditLimit) || 0,
                    bankName: formData.bankName || "-",
                    bankAccountNumber: formData.bankAccountNumber || "-",
                    bankAccountHolder: formData.bankAccountHolder || "-",
                    isActive: formData.isActive ?? true,
                  }
                : v
            )
          );

          setTimeout(() => {
            setIsModalOpen(false);
          }, 900);
        }
      } catch (err: any) {
        setFormError(err.message || "Terjadi kesalahan internal.");
      }
    });
  };

  const handleDelete = (vendorId: string, vendorName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus vendor "${vendorName}"?`)) return;

    setDeletingId(vendorId);
    startTransition(async () => {
      try {
        const res = await deleteTenantVendor(tenantSubdomain, vendorId);
        if (!res.success) {
          alert(res.error || "Gagal menghapus vendor.");
          setDeletingId(null);
          return;
        }

        setVendors((prev) => prev.filter((v) => v.id !== vendorId));
        setDeletingId(null);
      } catch (err: any) {
        alert(err.message || "Gagal menghapus vendor.");
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Pills & Search Bar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-[#121620] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("ALL");
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === "ALL"
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            Semua Kategori ({vendors.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("CARRIER_SEA");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === "CARRIER_SEA"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
            }`}
          >
            <Ship className="h-3.5 w-3.5" />
            <span>Pelayaran Laut</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("CARRIER_AIR");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === "CARRIER_AIR"
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100"
            }`}
          >
            <Plane className="h-3.5 w-3.5" />
            <span>Maskapai Udara</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("HAULAGE_TRUCK");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === "HAULAGE_TRUCK"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Armada Truk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("CUSTOMS_BROKER");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === "CUSTOMS_BROKER"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>PPJK / Bea Cukai</span>
          </button>
        </div>

        {/* Search Bar & Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama vendor, kode, NPWP, kontak..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <a
            href={`/api/${tenantSubdomain}/export/vendors`}
            download
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 shadow-2xs transition-all"
            title="Download Excel Semua Vendor"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Download Excel</span>
          </a>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-600/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Vendor Baru</span>
          </button>
        </div>
      </div>

      {/* CARD LIST GRID (Strict Mobile-First SaaS Layout, NO TABLE) */}
      {paginatedVendors.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
          <Truck className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            Tidak Ada Data Vendor Ditemukan
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `Tidak ada vendor yang cocok dengan "${searchQuery}".`
              : "Belum ada master data vendor carrier untuk tenant ini. Klik tombol di atas untuk mendaftarkan vendor pertama."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paginatedVendors.map((vendor) => {
            const config = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG.OTHERS;
            const IconComponent = config.icon;

            return (
              <div
                key={vendor.id}
                className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-xs hover:border-violet-500/30 transition-all space-y-4"
              >
                {/* Header: Name, Code, Category, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600/10 to-indigo-600/10 dark:from-violet-500/20 dark:to-indigo-500/20 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold text-xs shrink-0 border border-violet-500/20">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {vendor.name}
                        </h4>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          {vendor.vendorCode}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            config.color === "blue"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              : config.color === "violet"
                              ? "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
                              : config.color === "amber"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {vendor.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Ruang Kerja: <span className="font-mono text-violet-600 dark:text-violet-400">{tenantSubdomain}.sistemforwarding.com</span>
                      </p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        vendor.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/30"
                          : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          vendor.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      {vendor.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>

                {/* Key Financial & Tax Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">NPWP / Tax ID</span>
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                      {vendor.taxId}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Jatuh Tempo (TOP)</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {vendor.paymentTermDays} Hari Kalender
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Batas Kredit AP</span>
                    </div>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatIDR(vendor.creditLimit)}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Landmark className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Rekening Bank</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={`${vendor.bankName} - ${vendor.bankAccountNumber} a/n ${vendor.bankAccountHolder}`}>
                      {vendor.bankName !== "-" ? `${vendor.bankName} (${vendor.bankAccountNumber})` : "-"}
                    </p>
                  </div>
                </div>

                {/* Contact PIC & Geolocation Address */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {vendor.contactPerson}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{vendor.email}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{vendor.phone}</span>
                    </span>
                    {(vendor.cityName || vendor.provinceName) && (
                      <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {[vendor.districtName, vendor.cityName, vendor.provinceName]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => openEditModal(vendor)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === vendor.id}
                      onClick={() => handleDelete(vendor.id, vendor.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors disabled:opacity-50"
                    >
                      {deletingId === vendor.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalFilteredPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan halaman <span className="font-bold">{currentPage}</span> dari{" "}
            <span className="font-bold">{totalFilteredPages}</span> ({filteredVendors.length} vendor)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalFilteredPages}
              onClick={() => setCurrentPage((p) => Math.min(totalFilteredPages, p + 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT VENDOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#121620] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === "create" ? "Pendaftaran Mitra Vendor Baru" : "Edit Data Vendor"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Master data vendor AP terisolasi untuk ruang kerja {tenantSubdomain}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error & Success Alerts */}
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kode Vendor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kode Vendor (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.vendorCode}
                    onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                    placeholder="Contoh: MSK-ID atau VND-001"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                </div>

                {/* Nama Vendor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Perusahaan Vendor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: PT Maersk Indonesia"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Kategori Vendor via SearchableSelect */}
                <div className="sm:col-span-2">
                  <SearchableSelect
                    name="category"
                    label="Kategori Vendor Operasional"
                    required
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val as VendorCategory })}
                    options={categoryOptions}
                    placeholder="Pilih kategori vendor"
                    searchPlaceholder="Cari pelayaran, airlines, trucking, PPJK..."
                  />
                </div>

                {/* NPWP / Tax ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    NPWP / Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="01.234.567.8-012.000"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                </div>

                {/* Term of Payment (TOP) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Term of Payment (Hari)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.paymentTermDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermDays: Number(e.target.value) })}
                    placeholder="30"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Plafon Kredit AP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Batas Plafon Hutang AP (IDR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    placeholder="250000000"
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
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="true">Aktif (Dapat dipilih di Job File)</option>
                    <option value="false">Nonaktif (Arsip)</option>
                  </select>
                </div>
              </div>

              {/* Informas Rekening Bank */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Data Rekening Pembayaran Vendor (AP)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="BCA / Mandiri / CIMB"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      placeholder="8821039841"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Atas Nama Rekening
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountHolder}
                      onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                      placeholder="PT Maersk Indonesia"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Geographic Cascading Dropdowns */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Data Referensi Wilayah Geografis Indonesia
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    Alamat Lengkap Kantor / Depo
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Jl. Pelabuhan Raya No. 45"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama PIC Operasional
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Bpk. Hendra"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ops@maersk.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    No. Telepon / Hotline
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+6221500800"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
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
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-600/20 disabled:opacity-50 transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan ke DB...</span>
                    </>
                  ) : (
                    <span>{modalMode === "create" ? "Simpan Vendor" : "Perbarui Vendor"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
