import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LogoUploadCard } from "@/components/tenant/LogoUploadCard";
import { TenantSettingsForm } from "@/components/tenant/TenantSettingsForm";
import { TrackingWidgetSettingsCard } from "@/components/tenant/TrackingWidgetSettingsCard";
import {
  Building2,
  Shield,
  Globe,
  FileText,
  CheckCircle2,
  Hash,
  Percent,
  Coins,
  Lock,
  Layers,
  Scale,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface SettingsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantSettingsPage({ params }: SettingsPageProps) {
  const { tenant: subdomain } = await params;

  const [tenant, globalCurrencies, globalUnits, globalProvinces, globalItemTypes] = await Promise.all([
    prisma.tenant.findUnique({
      where: { subdomain },
      include: {
        prefixes: {
          orderBy: { prefixType: "asc" },
        },
        taxes: {
          orderBy: { isDefault: "desc" },
        },
        financialSettings: true,
      },
    }),
    prisma.masterCurrency.findMany({
      where: { isActive: true },
      orderBy: { isBaseCurrency: "desc" },
    }),
    prisma.masterUnit.findMany({
      where: { isActive: true },
      orderBy: [{ unitCategory: "asc" }, { unitCode: "asc" }],
    }),
    prisma.masterProvince.findMany({
      where: { isActive: true },
      include: {
        cities: {
          include: { districts: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.masterItemType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="w-full min-w-0 space-y-8 font-sans">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Pengaturan Ruang Kerja</span>
          <span>•</span>
          <span className="font-semibold text-violet-600 dark:text-violet-400">
            {tenant.subdomain}.sistemforwarding.com
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Identitas &amp; Master Konfigurasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kustomisasi visual, format penomoran dokumen kargo, kurs mata uang, satuan muatan (UoM), dan kebijakan tarif PPN yang tersimpan di PostgreSQL.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: General Configuration Form, Logo Branding & Master Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tenant Profile & Financial Policy Interactive Settings Form */}
          <TenantSettingsForm
            tenantId={tenant.id}
            tenantSubdomain={tenant.subdomain}
            initialCompanyName={tenant.companyName}
            initialLegalName={tenant.legalName}
            initialTaxId={tenant.taxId}
            initialBaseCurrency={tenant.financialSettings?.baseCurrency || "IDR"}
            initialDefaultPaymentTermDays={
              tenant.financialSettings?.defaultPaymentTermDays || 30
            }
            initialTaxCalculationMode={
              tenant.financialSettings?.taxCalculationMode || "EXCLUSIVE"
            }
            initialDefaultTaxId={tenant.taxes.find((t) => t.isDefault)?.id}
            currencies={globalCurrencies.map((c) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              symbol: c.symbol,
              isBaseCurrency: c.isBaseCurrency,
            }))}
            taxes={tenant.taxes.map((t) => ({
              id: t.id,
              taxCode: t.taxCode,
              taxName: t.taxName,
              taxRatePercent: t.taxRatePercent.toString(),
              isDefault: t.isDefault,
            }))}
          />

          <LogoUploadCard
            tenantId={tenant.id}
            tenantSubdomain={tenant.subdomain}
            companyName={tenant.companyName}
            currentLogoUrl={tenant.logoUrl}
          />

          {/* Website Tracking Widget Embed & Integration Card */}
          <TrackingWidgetSettingsCard
            subdomain={tenant.subdomain}
            companyName={tenant.companyName}
          />

          {/* MasterPrefix Settings (Database-Driven Auto-Numbering) */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
                  <Hash className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    MasterPrefix (Format Penomoran Dokumen)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Engine penomoran berurutan tanpa jeda di PostgreSQL
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full border border-violet-200/60 dark:border-violet-500/30">
                {tenant.prefixes.length} Aturan Aktif
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {tenant.prefixes.map((pref) => (
                <div key={pref.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {pref.prefixType}
                    </span>
                    <span className="font-mono text-[11px] text-violet-600 dark:text-violet-400">
                      {pref.formatPattern}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                      Urutan: #{pref.currentSequence}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Padding: {pref.zeroPadding} digit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MasterCurrency & MasterUnit (Mata Uang & Satuan Kargo) */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    MasterCurrency &amp; MasterUnit (UoM)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kamus mata uang, simbol, kurs konversi, dan satuan muatan kargo
                  </p>
                </div>
              </div>
            </div>

            {/* Currency Badges */}
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-2">
                Daftar Mata Uang Aktif (MasterCurrency)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {globalCurrencies.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs text-center"
                  >
                    <span className="font-black text-slate-900 dark:text-white block">
                      {c.code} ({c.symbol})
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate" title={c.name}>
                      {c.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-violet-600 dark:text-violet-400 block mt-1">
                      {c.isBaseCurrency ? "Base (1.0)" : `Kurs: ${Number(c.exchangeRate).toLocaleString("id-ID")}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Units Badges */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-2">
                Satuan Ukuran Kargo / Armada (MasterUnit)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {globalUnits.map((u) => (
                  <span
                    key={u.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 text-[11px] font-semibold"
                    title={`${u.unitName} - ${u.description || ""}${u.maxWeightKg ? ` (Max: ${Number(u.maxWeightKg).toLocaleString()} Kg)` : ""}${u.maxVolumeCbm ? ` (Vol: ${Number(u.maxVolumeCbm)} CBM)` : ""}`}
                  >
                    <span className="font-mono font-bold text-violet-600 dark:text-violet-400 mr-1">
                      {u.unitCode}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">({u.unitCategory})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Item Types Badges (MasterItemType) */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-2">
                Klasifikasi Komoditas Muatan (MasterItemType)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {globalItemTypes.map((it) => (
                  <span
                    key={it.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 text-[11px] font-semibold flex items-center gap-1.5"
                    title={it.description || it.name}
                  >
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {it.itemCode}
                    </span>
                    <span>{it.name}</span>
                    {it.isDangerousGoods && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                        DG
                      </span>
                    )}
                    {it.requiresColdChain && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-400">
                        Reefer
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* MasterTax & Financial Settings */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Percent className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    MasterTax &amp; Pengaturan Keuangan
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tarif PPN Jasa Pengurusan Transportasi &amp; Mata Uang Dasar
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Mata Uang Fungsional
                </span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {tenant.financialSettings?.baseCurrency || "IDR"} (Rupiah)
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Term of Payment: {tenant.financialSettings?.defaultPaymentTermDays || 30} Hari
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Periode Lock Keuangan
                </span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {tenant.financialSettings?.isPeriodLockActive ? "Terkunci" : "Terbuka (Open)"}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Awal Tahun Buku: Bulan {tenant.financialSettings?.fiscalYearStartMonth || 1}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Tarif PPN Terkonfigurasi
              </span>
              {tenant.taxes.map((tax) => (
                <div
                  key={tax.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{tax.taxName}</span>
                    <span className="font-mono text-[10px] text-slate-400 block">Kode: {tax.taxCode}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {tax.taxRatePercent.toString()}%
                    </span>
                    {tax.isDefault && (
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">
                        Default Invoice
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Geographical Data (Provinsi, Kota, Kecamatan) */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Master Wilayah Geografis Indonesia
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Referensi alamat Vendor &amp; Customer untuk validitas faktur pajak
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-full border border-rose-200/60 dark:border-rose-500/30">
                {globalProvinces.length} Provinsi Aktif
              </span>
            </div>

            <div className="space-y-3">
              {globalProvinces.map((prov) => (
                <div
                  key={prov.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Provinsi {prov.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Kode: {prov.code || "-"}
                    </span>
                  </div>

                  <div className="space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-white/10">
                    {prov.cities.map((city) => (
                      <div key={city.id} className="space-y-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          • {city.name} ({city.type})
                        </span>
                        <div className="flex flex-wrap gap-1.5 pl-3">
                          {city.districts.map((dist) => (
                            <span
                              key={dist.id}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/5 text-[10px]"
                            >
                              Kec. {dist.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tenant Company Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tenant Profile Card */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-xs space-y-5 transition-colors">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="h-10 w-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Entitas Terdaftar</h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Basis data PostgreSQL terisolasi</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">Nama Perusahaan</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm block">{tenant.companyName}</span>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">Subdomain Workspace</span>
                <span className="font-mono text-violet-600 dark:text-violet-400 font-semibold bg-violet-50 dark:bg-violet-950/60 px-2.5 py-1 rounded-lg inline-block border border-violet-200/60 dark:border-violet-500/30">
                  {tenant.subdomain}.sistemforwarding.com
                </span>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">Status Langganan</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tenant.subscriptionStatus === "EXPIRED"
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-500/30"
                      : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/30"
                  }`}>
                    {tenant.subscriptionStatus}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Paket {tenant.subscriptionTier} ({tenant.billingCycle})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">Masa Berlaku / Jatuh Tempo</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  {tenant.trialEndsAt
                    ? new Date(tenant.trialEndsAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Tidak Terbatas / Pay-Per-Job"}
                </span>
                {tenant.trialEndsAt && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) > 0
                      ? `Tersisa ${Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} hari lagi`
                      : "Masa langganan telah berakhir"}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">NPWP / Tax ID</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">
                  {tenant.taxId || "Belum dikonfigurasi"}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] text-[11px] text-slate-400 dark:text-slate-500">
                Terdaftar sejak: {new Date(tenant.createdAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-3xl border border-slate-200/70 dark:border-white/[0.08] p-5 space-y-3 transition-colors">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>Isolasi Multi-Tenant Berstandar Enterprise</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-violet-600 dark:text-violet-400 font-bold">•</span>
                <span>Setiap tabel master (Vendor, Customer, Prefix, Tax) terikat kuat pada foreign key <code className="text-[10px] font-mono bg-white dark:bg-white/10 px-1 py-0.5 rounded">tenantId</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600 dark:text-violet-400 font-bold">•</span>
                <span>Data pelabuhan (UN/LOCODE), mata uang (MasterCurrency), dan satuan (MasterUnit) tersedia secara terpusat dan konsisten.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600 dark:text-violet-400 font-bold">•</span>
                <span>Penomoran Job File &amp; Faktur terjamin berurutan secara transaksional tanpa risiko tabrakan data antar klien.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
