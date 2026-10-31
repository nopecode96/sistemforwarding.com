"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Anchor,
  Layers,
  Hash,
  Scale,
  DollarSign,
  Box,
  Truck,
  Ship,
  Plane,
  ShieldAlert,
  ThermometerSnowflake,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Map,
  Compass,
  FileText,
  ChevronLeft,
  ChevronRight,
  Building,
} from "lucide-react";
import Link from "next/link";
import { SearchableSelect, SearchOption } from "@/components/ui/SearchableSelect";
import {
  createMasterPort,
  updateMasterPort,
  deleteMasterPort,
  createMasterUnit,
  updateMasterUnit,
  deleteMasterUnit,
  createMasterItemType,
  updateMasterItemType,
  deleteMasterItemType,
  createMasterProvince,
  updateMasterProvince,
  deleteMasterProvince,
  createMasterCity,
  updateMasterCity,
  deleteMasterCity,
  createMasterDistrict,
  updateMasterDistrict,
  deleteMasterDistrict,
  createMasterPrefix,
  updateMasterPrefix,
  deleteMasterPrefix,
  createMasterCurrency,
  updateMasterCurrency,
  deleteMasterCurrency,
} from "@/actions/masterReferenceActions";
import { PortType, UnitCategory, PrefixType } from "@prisma/client";

interface ProvinceData {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  cities: Array<{
    id: string;
    provinceId: string;
    code: string;
    name: string;
    type: string;
    isActive: boolean;
    districts: Array<{
      id: string;
      cityId: string;
      code: string;
      name: string;
      isActive: boolean;
    }>;
  }>;
}

interface MasterDataViewProps {
  tenantSubdomain: string;
  companyName: string;
  initialTab?: string;
  ports: any[];
  units: any[];
  itemTypes: any[];
  prefixes: any[];
  currencies: any[];
  provinces: ProvinceData[];
}

export function MasterDataView({
  tenantSubdomain,
  companyName,
  initialTab,
  ports: initialPorts,
  units: initialUnits,
  itemTypes: initialItemTypes,
  prefixes: initialPrefixes,
  currencies: initialCurrencies,
  provinces: initialProvinces,
}: MasterDataViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Sync Active Tab with URL Query Parameter (?tab=...)
  const activeTab = searchParams.get("tab") || initialTab || "port";

  const handleTabChange = (tabId: string) => {
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  // Local state for instant optimistic feedback
  const [ports, setPorts] = useState(initialPorts);
  const [units, setUnits] = useState(initialUnits);
  const [itemTypes, setItemTypes] = useState(initialItemTypes);
  const [prefixes, setPrefixes] = useState(initialPrefixes);
  const [currencies, setCurrencies] = useState(initialCurrencies);
  const [provinces, setProvinces] = useState(initialProvinces);

  const [searchQuery, setSearchQuery] = useState("");
  const [unitCategoryFilter, setUnitCategoryFilter] = useState<string>("ALL");
  const [geoLevel, setGeoLevel] = useState<"PROVINCE" | "CITY" | "DISTRICT">("PROVINCE");

  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Modal Control
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Reset notifications on tab change
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
    setSearchQuery("");
  }, [activeTab]);

  // Tab Definitions
  const tabs = [
    {
      id: "port",
      label: "Pelabuhan & Rute",
      count: ports.length,
      icon: Anchor,
      badge: "UN/LOCODE",
    },
    {
      id: "unit",
      label: "Satuan & Dimensi",
      count: units.length,
      icon: Scale,
      badge: `${units.length} Unit`,
    },
    {
      id: "itemType",
      label: "Kategori Komoditas",
      count: itemTypes.length,
      icon: Box,
      badge: `${itemTypes.length} Tipe`,
    },
    {
      id: "wilayah",
      label: "Master Wilayah",
      count: provinces.length,
      icon: Map,
      badge: "Indonesia",
    },
    {
      id: "prefix",
      label: "Format Penomoran",
      count: prefixes.length,
      icon: Hash,
      badge: "Isolasi",
    },
    {
      id: "currency",
      label: "Mata Uang & Kurs",
      count: currencies.length,
      icon: DollarSign,
      badge: "Forex",
    },
  ];

  // Helper for closing modals
  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
    setFormError(null);
    setFormSuccess(null);
  };

  // ============================================================================
  // TAB 1: PORTS HANDLERS
  // ============================================================================
  const filteredPorts = useMemo(() => {
    if (!searchQuery.trim()) return ports;
    const q = searchQuery.toLowerCase();
    return ports.filter(
      (p: any) =>
        p.portCode.toLowerCase().includes(q) ||
        p.portName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.countryName && p.countryName.toLowerCase().includes(q))
    );
  }, [ports, searchQuery]);

  const handleDeletePort = (id: string, name: string) => {
    if (!confirm(`Hapus pelabuhan "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteMasterPort(id);
      if (res.success) {
        setPorts((prev) => prev.filter((p: any) => p.id !== id));
      } else {
        alert(res.error || "Gagal menghapus pelabuhan.");
      }
    });
  };

  // ============================================================================
  // TAB 2: UNITS HANDLERS
  // ============================================================================
  const filteredUnits = useMemo(() => {
    return units.filter((u: any) => {
      const matchCat = unitCategoryFilter === "ALL" || u.unitCategory === unitCategoryFilter;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.unitCode.toLowerCase().includes(q) ||
        u.unitName.toLowerCase().includes(q) ||
        (u.symbol && u.symbol.toLowerCase().includes(q))
      );
    });
  }, [units, unitCategoryFilter, searchQuery]);

  const handleDeleteUnit = (id: string, code: string) => {
    if (!confirm(`Hapus satuan [${code}]?`)) return;
    startTransition(async () => {
      const res = await deleteMasterUnit(id);
      if (res.success) {
        setUnits((prev) => prev.filter((u: any) => u.id !== id));
      } else {
        alert(res.error || "Gagal menghapus satuan.");
      }
    });
  };

  // ============================================================================
  // TAB 3: COMMODITIES (ITEM TYPES) HANDLERS
  // ============================================================================
  const filteredItemTypes = useMemo(() => {
    if (!searchQuery.trim()) return itemTypes;
    const q = searchQuery.toLowerCase();
    return itemTypes.filter(
      (it: any) =>
        it.itemCode.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        (it.description && it.description.toLowerCase().includes(q))
    );
  }, [itemTypes, searchQuery]);

  const handleDeleteItemType = (id: string, name: string) => {
    if (!confirm(`Hapus kategori komoditas "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteMasterItemType(id);
      if (res.success) {
        setItemTypes((prev) => prev.filter((it: any) => it.id !== id));
      } else {
        alert(res.error || "Gagal menghapus komoditas.");
      }
    });
  };

  // ============================================================================
  // TAB 4: MASTER WILAYAH INDONESIA HANDLERS
  // ============================================================================
  // Flatten cities and districts for tableless display
  const allCities = useMemo(() => {
    const list: any[] = [];
    provinces.forEach((p) => {
      p.cities.forEach((c) => {
        list.push({ ...c, provinceName: p.name });
      });
    });
    return list;
  }, [provinces]);

  const allDistricts = useMemo(() => {
    const list: any[] = [];
    provinces.forEach((p) => {
      p.cities.forEach((c) => {
        c.districts.forEach((d) => {
          list.push({ ...d, cityName: c.name, provinceName: p.name });
        });
      });
    });
    return list;
  }, [provinces]);

  const filteredProvinces = useMemo(() => {
    if (!searchQuery.trim()) return provinces;
    const q = searchQuery.toLowerCase();
    return provinces.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [provinces, searchQuery]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return allCities;
    const q = searchQuery.toLowerCase();
    return allCities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.provinceName.toLowerCase().includes(q)
    );
  }, [allCities, searchQuery]);

  const filteredDistricts = useMemo(() => {
    if (!searchQuery.trim()) return allDistricts;
    const q = searchQuery.toLowerCase();
    return allDistricts.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.cityName.toLowerCase().includes(q) ||
        d.provinceName.toLowerCase().includes(q)
    );
  }, [allDistricts, searchQuery]);

  const handleDeleteProvince = (id: string, name: string) => {
    if (!confirm(`Hapus provinsi "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteMasterProvince(id);
      if (res.success) {
        setProvinces((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(res.error || "Gagal menghapus provinsi.");
      }
    });
  };

  const handleDeleteCity = (id: string, name: string) => {
    if (!confirm(`Hapus kota/kabupaten "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteMasterCity(id);
      if (res.success) {
        setProvinces((prev) =>
          prev.map((p) => ({
            ...p,
            cities: p.cities.filter((c) => c.id !== id),
          }))
        );
      } else {
        alert(res.error || "Gagal menghapus kota.");
      }
    });
  };

  const handleDeleteDistrict = (id: string, name: string) => {
    if (!confirm(`Hapus kecamatan "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteMasterDistrict(id);
      if (res.success) {
        setProvinces((prev) =>
          prev.map((p) => ({
            ...p,
            cities: p.cities.map((c) => ({
              ...c,
              districts: c.districts.filter((d) => d.id !== id),
            })),
          }))
        );
      } else {
        alert(res.error || "Gagal menghapus kecamatan.");
      }
    });
  };

  // Options for City & District creation
  const provinceOptions: SearchOption[] = useMemo(
    () =>
      provinces.map((p) => ({
        value: p.id,
        label: p.name,
        badge: p.code !== "-" ? p.code : undefined,
        category: "Provinsi Indonesia",
      })),
    [provinces]
  );

  const cityOptions: SearchOption[] = useMemo(
    () =>
      allCities.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.provinceName})`,
        badge: c.type,
        category: c.provinceName,
      })),
    [allCities]
  );

  // ============================================================================
  // TAB 5: PREFIXES HANDLERS
  // ============================================================================
  const handleDeletePrefix = (id: string, type: string) => {
    if (!confirm(`Hapus format penomoran ${type}?`)) return;
    startTransition(async () => {
      const res = await deleteMasterPrefix(tenantSubdomain, id);
      if (res.success) {
        setPrefixes((prev: any) => prev.filter((p: any) => p.id !== id));
      } else {
        alert(res.error || "Gagal menghapus format penomoran.");
      }
    });
  };

  // ============================================================================
  // TAB 6: CURRENCIES HANDLERS
  // ============================================================================
  const handleDeleteCurrency = (id: string, code: string) => {
    if (!confirm(`Hapus mata uang ${code}?`)) return;
    startTransition(async () => {
      const res = await deleteMasterCurrency(tenantSubdomain, id);
      if (res.success) {
        setCurrencies((prev: any) => prev.filter((c: any) => c.id !== id));
      } else {
        alert(res.error || "Gagal menghapus mata uang.");
      }
    });
  };

  return (
    <div className="w-full min-w-0 space-y-6 font-sans">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Pusat Kontrol Master Data &amp; Konfigurasi</span>
          <span>•</span>
          <span className="font-semibold text-violet-600 dark:text-violet-400 font-mono">
            {tenantSubdomain}.sistemforwarding.com
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Pusat Kontrol Master Data
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Kamus referensi pelabuhan global, satuan ukuran kargo, armada truk, komoditas, hirarki wilayah Indonesia, dan pola penomoran.
            </p>
          </div>
        </div>
      </div>

      {/* Notice Banner: Dedicated Customer & Vendor Pages */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-blue-500/10 border border-violet-500/20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-violet-600/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Menu Customer &amp; Vendor Telah Menjadi Halaman Mandiri
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola data pelanggan (AR) dan rekanan kapal/truk (AP) secara komprehensif melalui menu utama sidebar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 bg-white dark:bg-[#121620] hover:bg-violet-50 dark:hover:bg-white/10 border border-violet-200 dark:border-white/10 transition-colors shadow-xs"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Data Customer</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href="/vendors"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-[#121620] hover:bg-blue-50 dark:hover:bg-white/10 border border-blue-200 dark:border-white/10 transition-colors shadow-xs"
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Mitra Vendor</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Modern Capsule Tab Switcher (Synced to URL ?tab=[tab_category]) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-[#121620] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PORTS (PELABUHAN & RUTE) WITH CRUD */}
      {/* ==================================================================== */}
      {activeTab === "port" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode UN/LOCODE, nama pelabuhan, kota..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setModalMode("create");
                setSelectedItem({
                  portCode: "",
                  portName: "",
                  portType: "SEA_PORT",
                  city: "",
                  countryCode: "ID",
                  countryName: "Indonesia",
                  isMajor: true,
                });
                setActiveModal("port");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-600/20 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Pelabuhan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPorts.map((port: any) => (
              <div
                key={port.id}
                className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-3 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                    {port.portCode}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      port.portType === "AIR_PORT"
                        ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                        : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {port.portType === "AIR_PORT" ? <Plane className="h-3 w-3" /> : <Ship className="h-3 w-3" />}
                    <span>{port.portType}</span>
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {port.portName}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {port.city}, {port.countryName || port.countryCode}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedItem(port);
                      setActiveModal("port");
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    title="Edit Pelabuhan"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDeletePort(port.id, port.portName)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Hapus Pelabuhan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: UNITS (SATUAN & DIMENSI ARMADA) WITH CRUD */}
      {/* ==================================================================== */}
      {activeTab === "unit" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08]">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {["ALL", "WEIGHT", "VOLUME", "PACKAGE", "CONTAINER", "TRUCK"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setUnitCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    unitCategoryFilter === cat
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setModalMode("create");
                setSelectedItem({
                  unitCode: "",
                  unitName: "",
                  unitCategory: "PACKAGE",
                  symbol: "",
                  maxWeightKg: 0,
                  maxVolumeCbm: 0,
                  tareWeightKg: 0,
                  lengthM: 0,
                  widthM: 0,
                  heightM: 0,
                  description: "",
                });
                setActiveModal("unit");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-600/20 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Satuan / Armada</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((u: any) => (
              <div
                key={u.id}
                className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-3 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                      {u.unitCode}
                    </span>
                    {u.symbol && <span className="text-xs font-mono text-slate-400">({u.symbol})</span>}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      u.unitCategory === "CONTAINER"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : u.unitCategory === "TRUCK"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : u.unitCategory === "WEIGHT"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : u.unitCategory === "VOLUME"
                        ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                        : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                    }`}
                  >
                    {u.unitCategory}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{u.unitName}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                    {u.description || "Standar logistik"}
                  </p>
                </div>

                {(u.maxWeightKg || u.maxVolumeCbm || u.lengthM) && (
                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                    {u.maxWeightKg && (
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Beban Max</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {u.maxWeightKg.toLocaleString()} Kg
                        </span>
                      </div>
                    )}
                    {u.maxVolumeCbm && (
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Volume Max</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {u.maxVolumeCbm} CBM
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedItem(u);
                      setActiveModal("unit");
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDeleteUnit(u.id, u.unitCode)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: COMMODITIES (MASTER ITEM TYPE) WITH CRUD */}
      {/* ==================================================================== */}
      {activeTab === "itemType" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode komoditas, nama, deskripsi..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setModalMode("create");
                setSelectedItem({
                  itemCode: "",
                  name: "",
                  isDangerousGoods: false,
                  unNumber: "",
                  classDg: "",
                  requiresColdChain: false,
                  minTemperature: 0,
                  maxTemperature: 0,
                  description: "",
                });
                setActiveModal("itemType");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-600/20 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Komoditas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItemTypes.map((it: any) => (
              <div
                key={it.id}
                className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-3 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                    {it.itemCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {it.isDangerousGoods && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <ShieldAlert className="h-3 w-3" />
                        <span>DG</span>
                      </span>
                    )}
                    {it.requiresColdChain && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <ThermometerSnowflake className="h-3 w-3" />
                        <span>Cold Chain</span>
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{it.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                    {it.description || "Klasifikasi komoditas pengiriman standar."}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedItem(it);
                      setActiveModal("itemType");
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDeleteItemType(it.id, it.name)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: MASTER WILAYAH INDONESIA (PROVINSI, KOTA, KECAMATAN) WITH CRUD */}
      {/* ==================================================================== */}
      {activeTab === "wilayah" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08]">
            {/* Level Selector Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setGeoLevel("PROVINCE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  geoLevel === "PROVINCE"
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Provinsi ({provinces.length})
              </button>
              <button
                type="button"
                onClick={() => setGeoLevel("CITY")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  geoLevel === "CITY"
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Kota / Kab ({allCities.length})
              </button>
              <button
                type="button"
                onClick={() => setGeoLevel("DISTRICT")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  geoLevel === "DISTRICT"
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Kecamatan ({allDistricts.length})
              </button>
            </div>

            {/* Actions: Search & Add button tailored to active level */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari nama ${geoLevel.toLowerCase()}...`}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalMode("create");
                  if (geoLevel === "PROVINCE") {
                    setSelectedItem({ name: "", code: "" });
                    setActiveModal("geoProvince");
                  } else if (geoLevel === "CITY") {
                    setSelectedItem({
                      provinceId: provinces[0]?.id || "",
                      name: "",
                      type: "KOTA",
                      code: "",
                    });
                    setActiveModal("geoCity");
                  } else {
                    setSelectedItem({
                      cityId: allCities[0]?.id || "",
                      name: "",
                      code: "",
                    });
                    setActiveModal("geoDistrict");
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-sm transition-all shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>
                  Tambah {geoLevel === "PROVINCE" ? "Provinsi" : geoLevel === "CITY" ? "Kota/Kab" : "Kecamatan"}
                </span>
              </button>
            </div>
          </div>

          {/* Level 1: Provinsi Cards */}
          {geoLevel === "PROVINCE" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProvinces.map((prov) => (
                <div
                  key={prov.id}
                  className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-3 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                      BPS: {prov.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {prov.cities.length} Kota / Kab
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-violet-500" />
                      <span>{prov.name}</span>
                    </h3>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode("edit");
                        setSelectedItem(prov);
                        setActiveModal("geoProvince");
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteProvince(prov.id, prov.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Level 2: Kota / Kabupaten Cards */}
          {geoLevel === "CITY" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCities.map((city: any) => (
                <div
                  key={city.id}
                  className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-3 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      {city.type}
                    </span>
                    <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                      {city.provinceName}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building className="h-4 w-4 text-indigo-500" />
                      <span>{city.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {city.districts.length} Kecamatan terdaftar
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode("edit");
                        setSelectedItem(city);
                        setActiveModal("geoCity");
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteCity(city.id, city.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Level 3: Kecamatan Cards */}
          {geoLevel === "DISTRICT" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDistricts.map((dist: any) => (
                <div
                  key={dist.id}
                  className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-3 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      Kecamatan
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {dist.cityName}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Compass className="h-4 w-4 text-emerald-500" />
                      <span>{dist.name}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Wilayah: {dist.cityName}, {dist.provinceName}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode("edit");
                        setSelectedItem(dist);
                        setActiveModal("geoDistrict");
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteDistrict(dist.id, dist.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: FORMAT PENOMORAN (MASTER PREFIX) WITH CRUD */}
      {/* ==================================================================== */}
      {activeTab === "prefix" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08]">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Format Penomoran Dokumen Otomatis (MasterPrefix)
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Pola generator nomor Job File, Invoice Tagihan, dan Payment Voucher terisolasi per tenant.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setModalMode("create");
                setSelectedItem({
                  prefixType: "JOB_FILE",
                  prefixCode: "JF",
                  formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
                  zeroPadding: 5,
                  currentSequence: 0,
                  resetCycle: "YEARLY",
                });
                setActiveModal("prefix");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-600/20 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Format Penomoran</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prefixes.map((prefix: any) => (
              <div
                key={prefix.id}
                className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-3 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                    {prefix.prefixCode}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    Urutan: #{prefix.currentSequence}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    {prefix.prefixType}
                  </h3>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {prefix.formatPattern}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Padding: {prefix.zeroPadding} digit • Reset: {prefix.resetCycle}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedItem(prefix);
                      setActiveModal("prefix");
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDeletePrefix(prefix.id, prefix.prefixType)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: MATA UANG & KURS (MASTER CURRENCY) WITH CRUD */}
      {/* ==================================================================== */}
      {activeTab === "currency" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08]">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Mata Uang &amp; Nilai Tukar Standar (MasterCurrency)
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Mata uang dasar pembukuan (Base Currency) dan nilai tukar konversi transaksi ekspor-impor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setModalMode("create");
                setSelectedItem({
                  code: "",
                  name: "",
                  symbol: "",
                  exchangeRate: 1.0,
                  isBaseCurrency: false,
                });
                setActiveModal("currency");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-600/20 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Mata Uang</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currencies.map((c: any) => (
              <div
                key={c.id}
                className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-3 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                    {c.code}
                  </span>
                  {c.isBaseCurrency ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Base Currency
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400">
                      Forex
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                  <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    Simbol: {c.symbol}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Standard Kurs</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {c.isBaseCurrency ? "1.00 (Base)" : `Rp ${Number(c.exchangeRate || 1).toLocaleString("id-ID")}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode("edit");
                        setSelectedItem(c);
                        setActiveModal("currency");
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {!c.isBaseCurrency && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteCurrency(c.id, c.code)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* UNIVERSAL MODAL CRUD CONTROLLER */}
      {/* ==================================================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#121620] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {modalMode === "create" ? "Tambah Data" : "Edit Data"}:{" "}
                {activeModal === "port"
                  ? "Pelabuhan (UN/LOCODE)"
                  : activeModal === "unit"
                  ? "Satuan / Armada"
                  : activeModal === "itemType"
                  ? "Kategori Komoditas"
                  : activeModal === "geoProvince"
                  ? "Provinsi Indonesia"
                  : activeModal === "geoCity"
                  ? "Kota / Kabupaten"
                  : activeModal === "geoDistrict"
                  ? "Kecamatan"
                  : activeModal === "prefix"
                  ? "Format Penomoran"
                  : "Mata Uang & Kurs"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* FORM 1: PORT */}
            {activeModal === "port" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    setFormError(null);
                    const res =
                      modalMode === "create"
                        ? await createMasterPort(selectedItem)
                        : await updateMasterPort(selectedItem.id, selectedItem);
                    if (res.success) {
                      if (modalMode === "create") {
                        setPorts((prev: any) => [...prev, { ...selectedItem, id: res.id || Date.now().toString() }]);
                      } else {
                        setPorts((prev: any) => prev.map((p: any) => (p.id === selectedItem.id ? selectedItem : p)));
                      }
                      closeModal();
                    } else {
                      setFormError(res.error || "Gagal memproses data pelabuhan.");
                    }
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block font-bold mb-1">Kode UN/LOCODE (Contoh: IDJKT, SGSIN) *</label>
                  <input
                    type="text"
                    required
                    value={selectedItem.portCode}
                    onChange={(e) => setSelectedItem({ ...selectedItem, portCode: e.target.value.toUpperCase() })}
                    placeholder="IDJKT"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Nama Resmi Pelabuhan / Bandara *</label>
                  <input
                    type="text"
                    required
                    value={selectedItem.portName}
                    onChange={(e) => setSelectedItem({ ...selectedItem, portName: e.target.value })}
                    placeholder="Tanjung Priok Port"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tipe Pelabuhan</label>
                  <select
                    value={selectedItem.portType}
                    onChange={(e) => setSelectedItem({ ...selectedItem, portType: e.target.value as PortType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                  >
                    <option value="SEA_PORT">Pelabuhan Laut (SEA_PORT)</option>
                    <option value="AIR_PORT">Bandara Kargo (AIR_PORT)</option>
                    <option value="INLAND_TERMINAL">Terminal Darat (INLAND_TERMINAL)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kota</label>
                    <input
                      type="text"
                      value={selectedItem.city}
                      onChange={(e) => setSelectedItem({ ...selectedItem, city: e.target.value })}
                      placeholder="Jakarta"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Negara</label>
                    <input
                      type="text"
                      value={selectedItem.countryName}
                      onChange={(e) => setSelectedItem({ ...selectedItem, countryName: e.target.value })}
                      placeholder="Indonesia"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button type="button" onClick={closeModal} className="px-3.5 py-1.5 rounded-xl border">Batal</button>
                  <button type="submit" disabled={isPending} className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-bold">Simpan</button>
                </div>
              </form>
            )}

            {/* FORM 2: UNIT */}
            {activeModal === "unit" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    setFormError(null);
                    const res =
                      modalMode === "create"
                        ? await createMasterUnit(selectedItem)
                        : await updateMasterUnit(selectedItem.id, selectedItem);
                    if (res.success) {
                      if (modalMode === "create") {
                        setUnits((prev: any) => [...prev, { ...selectedItem, id: res.id || Date.now().toString() }]);
                      } else {
                        setUnits((prev: any) => prev.map((u: any) => (u.id === selectedItem.id ? selectedItem : u)));
                      }
                      closeModal();
                    } else {
                      setFormError(res.error || "Gagal memproses data satuan.");
                    }
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kode Unit *</label>
                    <input
                      type="text"
                      required
                      value={selectedItem.unitCode}
                      onChange={(e) => setSelectedItem({ ...selectedItem, unitCode: e.target.value.toUpperCase() })}
                      placeholder="20DC / CTN / KGS"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Kategori Unit</label>
                    <select
                      value={selectedItem.unitCategory}
                      onChange={(e) => setSelectedItem({ ...selectedItem, unitCategory: e.target.value as UnitCategory })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                    >
                      <option value="WEIGHT">WEIGHT (Satuan Berat)</option>
                      <option value="VOLUME">VOLUME (Satuan Kubikasi)</option>
                      <option value="PACKAGE">PACKAGE (Satuan Kemasan)</option>
                      <option value="CONTAINER">CONTAINER (Dimensi Kontainer)</option>
                      <option value="TRUCK">TRUCK (Armada Truk)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-1">Nama Satuan / Armada *</label>
                  <input
                    type="text"
                    required
                    value={selectedItem.unitName}
                    onChange={(e) => setSelectedItem({ ...selectedItem, unitName: e.target.value })}
                    placeholder="20ft Dry Container"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kapasitas Beban Max (Kg)</label>
                    <input
                      type="number"
                      value={selectedItem.maxWeightKg || ""}
                      onChange={(e) => setSelectedItem({ ...selectedItem, maxWeightKg: Number(e.target.value) })}
                      placeholder="28200"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Kapasitas Volume Max (CBM)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedItem.maxVolumeCbm || ""}
                      onChange={(e) => setSelectedItem({ ...selectedItem, maxVolumeCbm: Number(e.target.value) })}
                      placeholder="33.2"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-1">Deskripsi Logistik</label>
                  <input
                    type="text"
                    value={selectedItem.description || ""}
                    onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                    placeholder="Standar ISO 20 kaki kontainer"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button type="button" onClick={closeModal} className="px-3.5 py-1.5 rounded-xl border">Batal</button>
                  <button type="submit" disabled={isPending} className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-bold">Simpan</button>
                </div>
              </form>
            )}

            {/* FORM 3: ITEM TYPE */}
            {activeModal === "itemType" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    setFormError(null);
                    const res =
                      modalMode === "create"
                        ? await createMasterItemType(selectedItem)
                        : await updateMasterItemType(selectedItem.id, selectedItem);
                    if (res.success) {
                      if (modalMode === "create") {
                        setItemTypes((prev: any) => [...prev, { ...selectedItem, id: res.id || Date.now().toString() }]);
                      } else {
                        setItemTypes((prev: any) => prev.map((it: any) => (it.id === selectedItem.id ? selectedItem : it)));
                      }
                      closeModal();
                    } else {
                      setFormError(res.error || "Gagal memproses data komoditas.");
                    }
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kode Komoditas *</label>
                    <input
                      type="text"
                      required
                      value={selectedItem.itemCode}
                      onChange={(e) => setSelectedItem({ ...selectedItem, itemCode: e.target.value.toUpperCase() })}
                      placeholder="GEN / DG / ELEC"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Nama Klasifikasi *</label>
                    <input
                      type="text"
                      required
                      value={selectedItem.name}
                      onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                      placeholder="General Cargo"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={selectedItem.isDangerousGoods}
                      onChange={(e) => setSelectedItem({ ...selectedItem, isDangerousGoods: e.target.checked })}
                      className="rounded"
                    />
                    <span>Dangerous Goods (DG)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={selectedItem.requiresColdChain}
                      onChange={(e) => setSelectedItem({ ...selectedItem, requiresColdChain: e.target.checked })}
                      className="rounded"
                    />
                    <span>Cold Chain / Reefer</span>
                  </label>
                </div>
                <div>
                  <label className="block font-bold mb-1">Deskripsi</label>
                  <input
                    type="text"
                    value={selectedItem.description || ""}
                    onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                    placeholder="Barang umum kering non-berbahaya"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button type="button" onClick={closeModal} className="px-3.5 py-1.5 rounded-xl border">Batal</button>
                  <button type="submit" disabled={isPending} className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-bold">Simpan</button>
                </div>
              </form>
            )}

            {/* FORM 4A: PROVINSI */}
            {activeModal === "geoProvince" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    setFormError(null);
                    const res =
                      modalMode === "create"
                        ? await createMasterProvince(selectedItem)
                        : await updateMasterProvince(selectedItem.id, selectedItem);
                    if (res.success) {
                      if (modalMode === "create") {
                        setProvinces((prev) => [
                          ...prev,
                          { ...selectedItem, id: res.id || Date.now().toString(), cities: [], isActive: true },
                        ]);
                      } else {
                        setProvinces((prev) =>
                          prev.map((p) => (p.id === selectedItem.id ? { ...p, ...selectedItem } : p))
                        );
                      }
                      closeModal();
                    } else {
                      setFormError(res.error || "Gagal memproses data provinsi.");
                    }
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block font-bold mb-1">Nama Provinsi *</label>
                  <input
                    type="text"
                    required
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    placeholder="Contoh: Jawa Timur"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Kode BPS / Kemendagri (Opsional)</label>
                  <input
                    type="text"
                    value={selectedItem.code || ""}
                    onChange={(e) => setSelectedItem({ ...selectedItem, code: e.target.value })}
                    placeholder="Contoh: 35"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button type="button" onClick={closeModal} className="px-3.5 py-1.5 rounded-xl border">Batal</button>
                  <button type="submit" disabled={isPending} className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-bold">Simpan</button>
                </div>
              </form>
            )}

            {/* FORM 4B: KOTA / KABUPATEN */}
            {activeModal === "geoCity" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    setFormError(null);
                    const res =
                      modalMode === "create"
                        ? await createMasterCity(selectedItem)
                        : await updateMasterCity(selectedItem.id, selectedItem);
                    if (res.success) {
                      router.refresh();
                      closeModal();
                    } else {
                      setFormError(res.error || "Gagal memproses data kota.");
                    }
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <SearchableSelect
                    name="provinceId"
                    label="Pilih Provinsi *"
                    required
                    value={selectedItem.provinceId}
                    onChange={(val) => setSelectedItem({ ...selectedItem, provinceId: val })}
                    options={provinceOptions}
                    placeholder="Pilih provinsi induk"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Nama Kota / Kabupaten *</label>
                  <input
                    type="text"
                    required
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    placeholder="Kota Surabaya"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Tipe Wilayah</label>
                    <select
                      value={selectedItem.type || "KOTA"}
                      onChange={(e) => setSelectedItem({ ...selectedItem, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                    >
                      <option value="KOTA">KOTA</option>
                      <option value="KABUPATEN">KABUPATEN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Kode Kota (Opsional)</label>
                    <input
                      type="text"
                      value={selectedItem.code || ""}
                      onChange={(e) => setSelectedItem({ ...selectedItem, code: e.target.value })}
                      placeholder="3578"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button type="button" onClick={closeModal} className="px-3.5 py-1.5 rounded-xl border">Batal</button>
                  <button type="submit" disabled={isPending} className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-bold">Simpan</button>
                </div>
              </form>
            )}

            {/* FORM 4C: KECAMATAN */}
            {activeModal === "geoDistrict" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    setFormError(null);
                    const res =
                      modalMode === "create"
                        ? await createMasterDistrict(selectedItem)
                        : await updateMasterDistrict(selectedItem.id, selectedItem);
                    if (res.success) {
                      router.refresh();
                      closeModal();
                    } else {
                      setFormError(res.error || "Gagal memproses data kecamatan.");
                    }
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <SearchableSelect
                    name="cityId"
                    label="Pilih Kota / Kabupaten *"
                    required
                    value={selectedItem.cityId}
                    onChange={(val) => setSelectedItem({ ...selectedItem, cityId: val })}
                    options={cityOptions}
                    placeholder="Pilih kota induk"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Nama Kecamatan *</label>
                  <input
                    type="text"
                    required
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    placeholder="Wonokromo"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Kode Kecamatan (Opsional)</label>
                  <input
                    type="text"
                    value={selectedItem.code || ""}
                    onChange={(e) => setSelectedItem({ ...selectedItem, code: e.target.value })}
                    placeholder="3578010"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button type="button" onClick={closeModal} className="px-3.5 py-1.5 rounded-xl border">Batal</button>
                  <button type="submit" disabled={isPending} className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-bold">Simpan</button>
                </div>
              </form>
            )}

            {/* FORM 5: PREFIX */}
            {activeModal === "prefix" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    setFormError(null);
                    const res =
                      modalMode === "create"
                        ? await createMasterPrefix(tenantSubdomain, selectedItem)
                        : await updateMasterPrefix(tenantSubdomain, selectedItem.id, selectedItem);
                    if (res.success) {
                      router.refresh();
                      closeModal();
                    } else {
                      setFormError(res.error || "Gagal memproses format penomoran.");
                    }
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block font-bold mb-1">Tipe Dokumen</label>
                  <select
                    disabled={modalMode === "edit"}
                    value={selectedItem.prefixType}
                    onChange={(e) => setSelectedItem({ ...selectedItem, prefixType: e.target.value as PrefixType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border disabled:opacity-50"
                  >
                    <option value="JOB_FILE">JOB_FILE (Shipment Order)</option>
                    <option value="INVOICE">INVOICE (Tagihan AR)</option>
                    <option value="PAYMENT_VOUCHER">PAYMENT_VOUCHER (Voucher Bayar AP)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Prefix Code *</label>
                    <input
                      type="text"
                      required
                      value={selectedItem.prefixCode}
                      onChange={(e) => setSelectedItem({ ...selectedItem, prefixCode: e.target.value.toUpperCase() })}
                      placeholder="JF / INV / PV"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Zero Padding</label>
                    <input
                      type="number"
                      min="3"
                      max="8"
                      value={selectedItem.zeroPadding}
                      onChange={(e) => setSelectedItem({ ...selectedItem, zeroPadding: Number(e.target.value) })}
                      placeholder="5"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-1">Pola Format Penomoran *</label>
                  <input
                    type="text"
                    required
                    value={selectedItem.formatPattern}
                    onChange={(e) => setSelectedItem({ ...selectedItem, formatPattern: e.target.value })}
                    placeholder="{PREFIX}/{YEAR}/{MONTH}/{SEQ}"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Variabel tersedia: &#123;PREFIX&#125;, &#123;YEAR&#125;, &#123;MONTH&#125;, &#123;DAY&#125;, &#123;SEQ&#125;</p>
                </div>
                <div>
                  <label className="block font-bold mb-1">Urutan Terakhir Saat Ini</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedItem.currentSequence}
                    onChange={(e) => setSelectedItem({ ...selectedItem, currentSequence: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button type="button" onClick={closeModal} className="px-3.5 py-1.5 rounded-xl border">Batal</button>
                  <button type="submit" disabled={isPending} className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-bold">Simpan</button>
                </div>
              </form>
            )}

            {/* FORM 6: CURRENCY */}
            {activeModal === "currency" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    setFormError(null);
                    const res =
                      modalMode === "create"
                        ? await createMasterCurrency(tenantSubdomain, selectedItem)
                        : await updateMasterCurrency(tenantSubdomain, selectedItem.id, selectedItem);
                    if (res.success) {
                      router.refresh();
                      closeModal();
                    } else {
                      setFormError(res.error || "Gagal memproses mata uang.");
                    }
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kode ISO Mata Uang *</label>
                    <input
                      type="text"
                      required
                      disabled={modalMode === "edit"}
                      value={selectedItem.code}
                      onChange={(e) => setSelectedItem({ ...selectedItem, code: e.target.value.toUpperCase() })}
                      placeholder="USD / SGD / EUR"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Simbol Mata Uang *</label>
                    <input
                      type="text"
                      required
                      value={selectedItem.symbol}
                      onChange={(e) => setSelectedItem({ ...selectedItem, symbol: e.target.value })}
                      placeholder="$ / € / S$"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-1">Nama Mata Uang *</label>
                  <input
                    type="text"
                    required
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    placeholder="United States Dollar"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Nilai Tukar Standar (Terhadap IDR)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={selectedItem.exchangeRate}
                    onChange={(e) => setSelectedItem({ ...selectedItem, exchangeRate: Number(e.target.value) })}
                    placeholder="16000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button type="button" onClick={closeModal} className="px-3.5 py-1.5 rounded-xl border">Batal</button>
                  <button type="submit" disabled={isPending} className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-bold">Simpan</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
