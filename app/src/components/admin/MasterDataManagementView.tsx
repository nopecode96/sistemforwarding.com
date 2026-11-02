"use client";

import React, { useState } from "react";
import {
  Globe,
  Anchor,
  Plane,
  Truck,
  Coins,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { PortType, TransportMode } from "@prisma/client";
import {
  AdminPortItem,
  AdminCarrierItem,
  AdminCurrencyItem,
  getGlobalPorts,
  getGlobalCarriers,
  getGlobalCurrencies,
  upsertGlobalPort,
  deleteGlobalPort,
  upsertGlobalCarrier,
  deleteGlobalCarrier,
  updateGlobalExchangeRate,
  upsertGlobalCurrency,
  deleteGlobalCurrency,
} from "@/actions/adminMasterActions";

interface MasterDataManagementViewProps {
  initialPorts: {
    ports: AdminPortItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  initialCarriers: {
    carriers: AdminCarrierItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  initialCurrencies: AdminCurrencyItem[];
}

export function MasterDataManagementView({
  initialPorts,
  initialCarriers,
  initialCurrencies,
}: MasterDataManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"ports" | "carriers" | "currencies">("ports");

  // State: Ports
  const [portsData, setPortsData] = useState(initialPorts);
  const [portSearch, setPortSearch] = useState("");
  const [portTypeFilter, setPortTypeFilter] = useState<string>("ALL");
  const [editingPort, setEditingPort] = useState<AdminPortItem | null>(null);
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);

  // State: Carriers
  const [carriersData, setCarriersData] = useState(initialCarriers);
  const [carrierSearch, setCarrierSearch] = useState("");
  const [carrierModeFilter, setCarrierModeFilter] = useState<string>("ALL");
  const [editingCarrier, setEditingCarrier] = useState<AdminCarrierItem | null>(null);
  const [isCarrierModalOpen, setIsCarrierModalOpen] = useState(false);

  // State: Currencies
  const [currencies, setCurrencies] = useState(initialCurrencies);
  const [editingCurrency, setEditingCurrency] = useState<AdminCurrencyItem | null>(null);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [quickFxItem, setQuickFxItem] = useState<AdminCurrencyItem | null>(null);
  const [quickFxRate, setQuickFxRate] = useState<number>(0);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── PORT ACTIONS ──────────────────────────────────────────────────────────
  const refreshPorts = async (search = portSearch, type = portTypeFilter, page = 1) => {
    try {
      const filterType = type === "ALL" ? undefined : (type as PortType);
      const res = await getGlobalPorts({ search, portType: filterType, page, pageSize: 50 });
      setPortsData(res);
    } catch (err) {
      console.error("Gagal menyegarkan port:", err);
    }
  };

  const handleSavePort = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await upsertGlobalPort({
        id: editingPort?.id,
        portCode: form.get("portCode") as string,
        portName: form.get("portName") as string,
        portType: form.get("portType") as PortType,
        city: form.get("city") as string,
        countryCode: form.get("countryCode") as string,
        countryName: form.get("countryName") as string,
        isMajor: form.get("isMajor") === "on",
        isActive: form.get("isActive") === "on",
        latitude: form.get("latitude") ? Number(form.get("latitude")) : null,
        longitude: form.get("longitude") ? Number(form.get("longitude")) : null,
      });

      if (res.success) {
        showFeedback("success", res.message || "Pelabuhan berhasil disimpan.");
        setIsPortModalOpen(false);
        setEditingPort(null);
        await refreshPorts();
      } else {
        showFeedback("error", res.error || "Gagal menyimpan pelabuhan.");
      }
    } catch {
      showFeedback("error", "Terjadi kesalahan internal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePort = async (port: AdminPortItem) => {
    if (!confirm(`Hapus pelabuhan ${port.portCode} (${port.portName})?`)) return;
    try {
      const res = await deleteGlobalPort(port.id);
      if (res.success) {
        showFeedback("success", res.message || "Pelabuhan dihapus.");
        await refreshPorts();
      } else {
        showFeedback("error", res.error || "Gagal menghapus pelabuhan.");
      }
    } catch {
      showFeedback("error", "Gagal menghubungi server.");
    }
  };

  // ── CARRIER ACTIONS ───────────────────────────────────────────────────────
  const refreshCarriers = async (search = carrierSearch, mode = carrierModeFilter, page = 1) => {
    try {
      const filterMode = mode === "ALL" ? undefined : (mode as TransportMode);
      const res = await getGlobalCarriers({ search, mode: filterMode, page, pageSize: 50 });
      setCarriersData(res);
    } catch (err) {
      console.error("Gagal menyegarkan carriers:", err);
    }
  };

  const handleSaveCarrier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await upsertGlobalCarrier({
        id: editingCarrier?.id,
        carrierCode: form.get("carrierCode") as string,
        carrierName: form.get("carrierName") as string,
        mode: form.get("mode") as TransportMode,
        scacCode: (form.get("scacCode") as string) || null,
        iataCode: (form.get("iataCode") as string) || null,
        country: (form.get("country") as string) || null,
        website: (form.get("website") as string) || null,
        isActive: form.get("isActive") === "on",
      });

      if (res.success) {
        showFeedback("success", res.message || "Carrier berhasil disimpan.");
        setIsCarrierModalOpen(false);
        setEditingCarrier(null);
        await refreshCarriers();
      } else {
        showFeedback("error", res.error || "Gagal menyimpan carrier.");
      }
    } catch {
      showFeedback("error", "Terjadi kesalahan internal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCarrier = async (carrier: AdminCarrierItem) => {
    if (!confirm(`Hapus maskapai/pelayaran ${carrier.carrierCode} (${carrier.carrierName})?`)) return;
    try {
      const res = await deleteGlobalCarrier(carrier.id);
      if (res.success) {
        showFeedback("success", res.message || "Carrier dihapus.");
        await refreshCarriers();
      } else {
        showFeedback("error", res.error || "Gagal menghapus carrier.");
      }
    } catch {
      showFeedback("error", "Gagal menghubungi server.");
    }
  };

  // ── CURRENCY / FX ACTIONS ─────────────────────────────────────────────────
  const refreshCurrencies = async () => {
    try {
      const res = await getGlobalCurrencies();
      setCurrencies(res);
    } catch (err) {
      console.error("Gagal menyegarkan valas:", err);
    }
  };

  const handleQuickFxUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFxItem) return;
    setIsSubmitting(true);

    try {
      const res = await updateGlobalExchangeRate({
        id: quickFxItem.id,
        exchangeRate: quickFxRate,
      });

      if (res.success) {
        showFeedback("success", res.message || "Kurs berhasil diperbarui.");
        setQuickFxItem(null);
        await refreshCurrencies();
      } else {
        showFeedback("error", res.error || "Gagal memperbarui kurs.");
      }
    } catch {
      showFeedback("error", "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCurrency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);

    const isBase = Boolean(editingCurrency?.isBaseCurrency || (form.get("code") as string)?.toUpperCase() === "IDR");
    const code = (form.get("code") as string)?.trim().toUpperCase() || editingCurrency?.code || "";
    const rateInput = Number(form.get("exchangeRate"));
    const exchangeRate = isBase ? 1.0 : (isNaN(rateInput) ? Number(editingCurrency?.exchangeRate || 1.0) : rateInput);

    try {
      const res = await upsertGlobalCurrency({
        id: editingCurrency?.id,
        code,
        name: (form.get("name") as string)?.trim() || editingCurrency?.name || "",
        symbol: (form.get("symbol") as string)?.trim() || editingCurrency?.symbol || "",
        exchangeRate,
        isBaseCurrency: isBase,
        isActive: form.get("isActive") === "on",
      });

      if (res.success) {
        showFeedback("success", res.message || "Mata uang disimpan.");
        setIsCurrencyModalOpen(false);
        setEditingCurrency(null);
        await refreshCurrencies();
      } else {
        showFeedback("error", res.error || "Gagal menyimpan mata uang.");
      }
    } catch {
      showFeedback("error", "Terjadi kesalahan internal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCurrency = async (cur: AdminCurrencyItem) => {
    if (!confirm(`Hapus valuta asing ${cur.code} (${cur.name})?`)) return;
    try {
      const res = await deleteGlobalCurrency(cur.id);
      if (res.success) {
        showFeedback("success", res.message || "Mata uang dihapus.");
        await refreshCurrencies();
      } else {
        showFeedback("error", res.error || "Gagal menghapus mata uang.");
      }
    } catch {
      showFeedback("error", "Gagal menghubungi server.");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Master Governance
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Universal Freight Directory
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Globe className="w-7 h-7 text-blue-400" />
            Master Data Logistik Global Sedunia
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Katalog pelabuhan & bandara standar UN/LOCODE, maskapai & pelayaran dunia, serta standarisasi kurs valuta asing otomatis untuk seluruh tenant.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="relative z-10 flex items-center p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
          <button
            onClick={() => setActiveTab("ports")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "ports"
                ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>Pelabuhan & Bandara</span>
          </button>

          <button
            onClick={() => setActiveTab("carriers")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "carriers"
                ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Maskapai & Pelayaran</span>
          </button>

          <button
            onClick={() => setActiveTab("currencies")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "currencies"
                ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Kurs Valas & FX</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-medium border animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: PORTS & AIRPORTS (UN/LOCODE)                                 */}
      {/* ==================================================================== */}
      {activeTab === "ports" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kode UN/LOCODE, nama, kota, atau negara..."
                  value={portSearch}
                  onChange={(e) => {
                    setPortSearch(e.target.value);
                    refreshPorts(e.target.value, portTypeFilter);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <select
                value={portTypeFilter}
                onChange={(e) => {
                  setPortTypeFilter(e.target.value);
                  refreshPorts(portSearch, e.target.value);
                }}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/60 font-mono"
              >
                <option value="ALL">Semua Tipe Port</option>
                <option value="SEA_PORT">Pelabuhan Laut (SEA)</option>
                <option value="AIR_PORT">Bandara Udara (AIR)</option>
                <option value="INLAND_TERMINAL">Terminal Darat (INLAND)</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingPort(null);
                setIsPortModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah UN/LOCODE Port</span>
            </button>
          </div>

          {/* Ports Table */}
          <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/80 text-zinc-400 font-mono uppercase tracking-wider text-[10px] border-b border-zinc-800">
                  <th className="px-5 py-3.5">Kode UN/LOCODE</th>
                  <th className="px-5 py-3.5">Nama Fasilitas</th>
                  <th className="px-5 py-3.5">Tipe</th>
                  <th className="px-5 py-3.5">Kota & Negara</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {portsData.ports.length > 0 ? (
                  portsData.ports.map((port) => (
                    <tr key={port.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-400 text-sm">
                        {port.portCode}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{port.portName}</div>
                        {port.isMajor && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Major Hub
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            port.portType === "SEA_PORT"
                              ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                              : port.portType === "AIR_PORT"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          }`}
                        >
                          {port.portType === "SEA_PORT" && <Anchor className="w-3 h-3" />}
                          {port.portType === "AIR_PORT" && <Plane className="w-3 h-3" />}
                          {port.portType === "INLAND_TERMINAL" && <Truck className="w-3 h-3" />}
                          {port.portType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-zinc-200">{port.city}</div>
                        <div className="text-zinc-500 text-[11px] font-mono">
                          {port.countryName} ({port.countryCode})
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            port.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                          }`}
                        >
                          {port.isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPort(port);
                              setIsPortModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                            title="Edit Pelabuhan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePort(port)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                            title="Hapus Pelabuhan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-zinc-500 font-mono">
                      Tidak ada pelabuhan/bandara yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: GLOBAL CARRIERS (Shipping Lines & Airlines)                   */}
      {/* ==================================================================== */}
      {activeTab === "carriers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kode carrier, nama, SCAC, IATA, atau negara..."
                  value={carrierSearch}
                  onChange={(e) => {
                    setCarrierSearch(e.target.value);
                    refreshCarriers(e.target.value, carrierModeFilter);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <select
                value={carrierModeFilter}
                onChange={(e) => {
                  setCarrierModeFilter(e.target.value);
                  refreshCarriers(carrierSearch, e.target.value);
                }}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/60 font-mono"
              >
                <option value="ALL">Semua Moda Carrier</option>
                <option value="SEA">Pelayaran Laut (SEA)</option>
                <option value="AIR">Maskapai Udara (AIR)</option>
                <option value="INLAND">Angkutan Darat (INLAND)</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingCarrier(null);
                setIsCarrierModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Carrier Global</span>
            </button>
          </div>

          {/* Carriers Table */}
          <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/80 text-zinc-400 font-mono uppercase tracking-wider text-[10px] border-b border-zinc-800">
                  <th className="px-5 py-3.5">Kode Carrier</th>
                  <th className="px-5 py-3.5">Nama Maskapai / Pelayaran</th>
                  <th className="px-5 py-3.5">Moda</th>
                  <th className="px-5 py-3.5">Identitas Regulasi (SCAC / IATA)</th>
                  <th className="px-5 py-3.5">Negara</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {carriersData.carriers.length > 0 ? (
                  carriersData.carriers.map((carrier) => (
                    <tr key={carrier.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-400 text-sm">
                        {carrier.carrierCode}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{carrier.carrierName}</div>
                        {carrier.website && (
                          <a
                            href={carrier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-amber-400 font-mono mt-0.5"
                          >
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            carrier.mode === "SEA"
                              ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                              : carrier.mode === "AIR"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          }`}
                        >
                          {carrier.mode === "SEA" && <Anchor className="w-3 h-3" />}
                          {carrier.mode === "AIR" && <Plane className="w-3 h-3" />}
                          {carrier.mode === "INLAND" && <Truck className="w-3 h-3" />}
                          {carrier.mode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        {carrier.mode === "SEA" ? (
                          <span className="text-zinc-300">SCAC: {carrier.scacCode || "-"}</span>
                        ) : (
                          <span className="text-zinc-300">IATA: {carrier.iataCode || "-"}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-zinc-300">
                        {carrier.country || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            carrier.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                          }`}
                        >
                          {carrier.isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCarrier(carrier);
                              setIsCarrierModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                            title="Edit Carrier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCarrier(carrier)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                            title="Hapus Carrier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-zinc-500 font-mono">
                      Tidak ada maskapai/pelayaran yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: CURRENCY & DAILY FX RATES (VALAS)                             */}
      {/* ==================================================================== */}
      {activeTab === "currencies" && (
        <div className="space-y-6">
          {/* Base Currency Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 font-black">
                Rp
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Mata Uang Basis Fungsional Sistem: <span className="text-amber-400">IDR (Indonesian Rupiah)</span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Seluruh nilai kurs konversi valas di bawah ini dihitung relatif terhadap 1 unit mata uang asing ke Rupiah.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingCurrency(null);
                setIsCurrencyModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Valas Baru</span>
            </button>
          </div>

          {/* Currencies Grid / Table */}
          <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/80 text-zinc-400 font-mono uppercase tracking-wider text-[10px] border-b border-zinc-800">
                  <th className="px-5 py-3.5">Kode Valas</th>
                  <th className="px-5 py-3.5">Nama Mata Uang</th>
                  <th className="px-5 py-3.5">Simbol</th>
                  <th className="px-5 py-3.5 text-right">Kurs Konversi (terhadap IDR)</th>
                  <th className="px-5 py-3.5">Terakhir Diperbarui</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {currencies.map((cur) => (
                  <tr key={cur.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400 text-sm">
                      {cur.code}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-white">
                      {cur.name}
                      {cur.isBaseCurrency && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Base Functional
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-zinc-300 text-sm">
                      {cur.symbol}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-white text-sm">
                      Rp {cur.exchangeRate.toLocaleString("id-ID", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-400 text-[11px]">
                      {new Date(cur.updatedAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          cur.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                        }`}
                      >
                        {cur.isActive ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!cur.isBaseCurrency && (
                          <button
                            onClick={() => {
                              setQuickFxItem(cur);
                              setQuickFxRate(cur.exchangeRate);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-mono font-semibold transition-all cursor-pointer"
                          >
                            Update Kurs
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingCurrency(cur);
                            setIsCurrencyModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                          title="Edit Mata Uang"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!cur.isBaseCurrency && (
                          <button
                            onClick={() => handleDeleteCurrency(cur)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                            title="Hapus Mata Uang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT PORT                                               */}
      {/* ==================================================================== */}
      {isPortModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Anchor className="w-5 h-5 text-amber-400" />
                {editingPort ? "Edit Pelabuhan/Bandara" : "Tambah UN/LOCODE Port"}
              </h2>
              <button
                onClick={() => setIsPortModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePort} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Kode UN/LOCODE *</label>
                  <input
                    name="portCode"
                    defaultValue={editingPort?.portCode || ""}
                    placeholder="Contoh: IDJKT"
                    required
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono uppercase focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Tipe Port *</label>
                  <select
                    name="portType"
                    defaultValue={editingPort?.portType || "SEA_PORT"}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="SEA_PORT">Pelabuhan Laut (SEA)</option>
                    <option value="AIR_PORT">Bandara Udara (AIR)</option>
                    <option value="INLAND_TERMINAL">Terminal Darat (INLAND)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Nama Pelabuhan / Bandara *</label>
                <input
                  name="portName"
                  defaultValue={editingPort?.portName || ""}
                  placeholder="Contoh: Tanjung Priok Port"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Kota *</label>
                  <input
                    name="city"
                    defaultValue={editingPort?.city || ""}
                    placeholder="Jakarta"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Kode Negara (ISO2) *</label>
                  <input
                    name="countryCode"
                    defaultValue={editingPort?.countryCode || "ID"}
                    placeholder="ID"
                    maxLength={2}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono uppercase focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Nama Negara *</label>
                  <input
                    name="countryName"
                    defaultValue={editingPort?.countryName || "Indonesia"}
                    placeholder="Indonesia"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Latitude (Opsional)</label>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    defaultValue={editingPort?.latitude ?? ""}
                    placeholder="-6.1042"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Longitude (Opsional)</label>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    defaultValue={editingPort?.longitude ?? ""}
                    placeholder="106.8833"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    name="isMajor"
                    defaultChecked={editingPort?.isMajor ?? true}
                    className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span>Major Hub Internasional</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingPort?.isActive ?? true}
                    className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span>Status Aktif</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPortModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pelabuhan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT CARRIER                                            */}
      {/* ==================================================================== */}
      {isCarrierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plane className="w-5 h-5 text-amber-400" />
                {editingCarrier ? "Edit Carrier Global" : "Tambah Carrier Global"}
              </h2>
              <button
                onClick={() => setIsCarrierModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCarrier} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Kode Carrier *</label>
                  <input
                    name="carrierCode"
                    defaultValue={editingCarrier?.carrierCode || ""}
                    placeholder="Contoh: MSK / GA"
                    required
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono uppercase focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Moda Transportasi *</label>
                  <select
                    name="mode"
                    defaultValue={editingCarrier?.mode || "SEA"}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="SEA">Pelayaran Laut (SEA)</option>
                    <option value="AIR">Maskapai Udara (AIR)</option>
                    <option value="INLAND">Angkutan Darat (INLAND)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Nama Maskapai / Pelayaran *</label>
                <input
                  name="carrierName"
                  defaultValue={editingCarrier?.carrierName || ""}
                  placeholder="Contoh: Maersk Line / Garuda Indonesia Cargo"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Kode SCAC (Laut)</label>
                  <input
                    name="scacCode"
                    defaultValue={editingCarrier?.scacCode || ""}
                    placeholder="Contoh: MAEU"
                    maxLength={6}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono uppercase focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Kode IATA (Udara)</label>
                  <input
                    name="iataCode"
                    defaultValue={editingCarrier?.iataCode || ""}
                    placeholder="Contoh: GA / SQ"
                    maxLength={6}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono uppercase focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Negara Asal</label>
                  <input
                    name="country"
                    defaultValue={editingCarrier?.country || ""}
                    placeholder="Contoh: ID / SG / DK"
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono uppercase focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Website Portal Tracking</label>
                  <input
                    name="website"
                    type="url"
                    defaultValue={editingCarrier?.website || ""}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingCarrier?.isActive ?? true}
                    className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span>Status Aktif di Direktori Global</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCarrierModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Carrier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: QUICK UPDATE FX RATE                                          */}
      {/* ==================================================================== */}
      {quickFxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                Update Kurs {quickFxItem.code}
              </h2>
              <button
                onClick={() => setQuickFxItem(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickFxUpdate} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Mata Uang:</span>
                  <span className="font-bold text-white">{quickFxItem.name} ({quickFxItem.code})</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Kurs Saat Ini:</span>
                  <span className="font-mono text-zinc-300">
                    Rp {quickFxItem.exchangeRate.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-mono font-medium">
                  Nilai Kurs Baru (1 {quickFxItem.code} = ... IDR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={quickFxRate}
                    onChange={(e) => setQuickFxRate(Number(e.target.value))}
                    required
                    min={0.0001}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                💡 Kurs ini akan langsung diterapkan secara instan sebagai referensi konversi tagihan seluruh tenant.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setQuickFxItem(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Terapkan Kurs Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT CURRENCY                                           */}
      {/* ==================================================================== */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                {editingCurrency ? "Edit Mata Uang" : "Tambah Valas Baru"}
              </h2>
              <button
                onClick={() => setIsCurrencyModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrency} className="space-y-4 text-xs">
              {editingCurrency?.isBaseCurrency && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                  🔒 Mata uang basis fungsional sistem (IDR). Kode dan nilai kurs dikunci pada 1.0.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Kode Valas (ISO) *</label>
                  <input
                    name="code"
                    defaultValue={editingCurrency?.code || ""}
                    placeholder="Contoh: JPY"
                    required
                    maxLength={5}
                    readOnly={editingCurrency?.isBaseCurrency}
                    className={`w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono uppercase focus:outline-none focus:border-amber-500/60 ${
                      editingCurrency?.isBaseCurrency ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Simbol Valas *</label>
                  <input
                    name="symbol"
                    defaultValue={editingCurrency?.symbol || ""}
                    placeholder="Contoh: ¥"
                    required
                    maxLength={5}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Nama Mata Uang *</label>
                <input
                  name="name"
                  defaultValue={editingCurrency?.name || ""}
                  placeholder="Contoh: Japanese Yen"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Kurs Terhadap IDR *</label>
                <input
                  name="exchangeRate"
                  type="number"
                  step="any"
                  defaultValue={editingCurrency?.isBaseCurrency ? 1 : editingCurrency?.exchangeRate || ""}
                  placeholder="Contoh: 105"
                  required
                  readOnly={editingCurrency?.isBaseCurrency}
                  className={`w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500/60 ${
                    editingCurrency?.isBaseCurrency ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingCurrency?.isActive ?? true}
                    className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span>Status Aktif</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCurrencyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Valas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
