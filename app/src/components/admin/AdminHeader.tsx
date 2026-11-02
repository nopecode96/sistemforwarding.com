"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  LogOut,
  ArrowUpRight,
  ChevronDown,
  Shield,
  Activity,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";
import { getUserInitials } from "@/lib/auth-utils";
import { AdminLogoutModal } from "./AdminLogoutModal";
import type { AdminSessionUser } from "./AdminLayoutShell";

interface AdminHeaderProps {
  onOpenMobile: () => void;
  pageTitle?: string;
  pageDescription?: string;
  session?: AdminSessionUser | null;
  onRequestLogout?: () => void;
}

export function AdminHeader({
  onOpenMobile,
  pageTitle,
  pageDescription,
  session,
  onRequestLogout,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [internalLogoutOpen, setInternalLogoutOpen] = useState(false);
  const [isInternalLoggingOut, setIsInternalLoggingOut] = useState(false);

  // Close dropdown on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dropdownOpen) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen]);

  const isDirectAdminPath = pathname.startsWith("/admin");

  const userName = session?.name?.trim() || "Super Administrator";
  const userEmail = session?.email?.trim() || "superadmin@sistemforwarding.com";
  const userRole = session?.role?.trim() || "SUPERADMIN";
  const userInitials = getUserInitials(userName, "SA");

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    if (onRequestLogout) {
      onRequestLogout();
    } else {
      setInternalLogoutOpen(true);
    }
  };

  const handleStandaloneLogoutConfirm = async () => {
    setIsInternalLoggingOut(true);
    const host = typeof window !== "undefined" ? window.location.host : "";
    const isAdminSubdomain = host.startsWith("admin.");
    const targetLogin = isAdminSubdomain ? "/login" : isDirectAdminPath ? "/admin/login" : "/login";

    try {
      await logoutAction();
    } catch (error) {
      console.error("[AdminHeader] Logout error:", error);
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/auth/logout?redirect=${encodeURIComponent(targetLogin)}`;
  };

  const isTenants =
    pathname === "/tenants" ||
    pathname.startsWith("/tenants/") ||
    pathname === "/admin/tenants" ||
    pathname.startsWith("/admin/tenants/");
  const isPlans =
    pathname === "/plans" ||
    pathname.startsWith("/plans/") ||
    pathname === "/admin/plans" ||
    pathname.startsWith("/admin/plans/");
  const isBilling =
    pathname === "/billing" ||
    pathname.startsWith("/billing/") ||
    pathname === "/admin/billing" ||
    pathname.startsWith("/admin/billing/");
  const isAudit =
    pathname === "/audit" ||
    pathname.startsWith("/audit/") ||
    pathname === "/admin/audit" ||
    pathname.startsWith("/admin/audit/");
  const isArticles =
    pathname === "/articles" ||
    pathname.startsWith("/articles/") ||
    pathname === "/admin/articles" ||
    pathname.startsWith("/admin/articles/");
  const isBroadcasts =
    pathname === "/broadcasts" ||
    pathname.startsWith("/broadcasts/") ||
    pathname === "/admin/broadcasts" ||
    pathname.startsWith("/admin/broadcasts/");
  const isMasterData =
    pathname === "/master-data" ||
    pathname.startsWith("/master-data/") ||
    pathname === "/admin/master-data" ||
    pathname.startsWith("/admin/master-data/");
  const isSystem =
    pathname === "/system" ||
    pathname.startsWith("/system/") ||
    pathname === "/admin/system" ||
    pathname.startsWith("/admin/system/");
  const isDetail =
    (pathname.startsWith("/tenants/") && pathname !== "/tenants") ||
    (pathname.startsWith("/admin/tenants/") && pathname !== "/admin/tenants");

  const computedTitle =
    pageTitle ||
    (isDetail
      ? "Detail & Tata Kelola Tenant"
      : isTenants
      ? "Manajemen Ruang Kerja Tenant"
      : isPlans
      ? "Paket Langganan Platform"
      : isBilling
      ? "SaaS Billing & Invoices"
      : isMasterData
      ? "Master Data Logistik Global"
      : isAudit
      ? "Platform Audit Trail & Keamanan"
      : isArticles
      ? "CMS Artikel & Knowledge Hub"
      : isBroadcasts
      ? "Platform Broadcast & Pengumuman"
      : isSystem
      ? "Infrastruktur & Kesehatan Sistem"
      : "Eksekutif Analitik & Intelijen SaaS");

  const computedDescription =
    pageDescription ||
    (isDetail
      ? "Inspeksi parameter isolasi database, akun pengguna, dan konfigurasi paket."
      : isTenants
      ? "Pengelolaan lisensi, status aktif, isolasi multi-tenant, dan otentikasi klien forwarder."
      : isPlans
      ? "Konfigurasi tier paket SaaS, kuota user, batas job files, dan fitur produk SistemForwarding.com."
      : isBilling
      ? "Manajemen tagihan langganan multi-tenant, rekonsiliasi BorderPay QRIS, dan persetujuan transfer manual."
      : isMasterData
      ? "Tata kelola UN/LOCODE pelabuhan/bandara, maskapai/pelayaran, dan kurs valas."
      : isAudit
      ? "Pencatatan jejak audit aktivitas administrator, kepatuhan teknis, dan isolasi hak akses."
      : isArticles
      ? "Publikasi edukasi logistik, regulasi perpajakan PMK 71, dan konten SEO pengetahuan kargo."
      : isBroadcasts
      ? "Pengumuman dan siaran pemeliharaan sistem terpusat ke seluruh dashboard forwarder."
      : isSystem
      ? "Telemetri cluster PostgreSQL 16, Redis 7 cache, status SSL reverse proxy, dan meteran penyimpanan tenant."
      : "Telemetri pertumbuhan MRR, ARR, GMV logistik, dan utilisasi ekosistem SistemForwarding.com.");

  return (
    <>
      <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-3.5">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Mobile trigger & Page Titles */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenMobile}
              className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/80 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Root Governance
                </span>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {computedTitle}
                </h1>
              </div>
              <p className="hidden md:block text-xs text-zinc-400 truncate mt-0.5">
                {computedDescription}
              </p>
            </div>
          </div>

          {/* Right: Telemetry, Onboarding & User Profile Dropdown Widget */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Live Core Telemetry */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">SaaS Core Active</span>
            </div>

            {/* Quick Tenant Onboarding */}
            <a
              href="https://sistemforwarding.com/onboarding"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-all"
            >
              <span>Registrasi Tenant Baru</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
            </a>

            {/* Operator Profile Dropdown Widget */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 sm:pl-2 sm:pr-3 sm:py-1 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 text-left transition-all cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Profil Operator Super Admin"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black text-xs shrink-0 shadow-md shadow-amber-500/20">
                  {userInitials}
                </div>
                <div className="hidden md:flex flex-col min-w-0 pr-0.5">
                  <span className="text-xs font-bold text-white truncate leading-tight max-w-[130px]">
                    {userName}
                  </span>
                  <div className="flex items-center gap-1.5 leading-tight mt-0.5">
                    <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {userRole}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-zinc-100">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-zinc-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black text-xs shrink-0 shadow-md shadow-amber-500/20">
                          {userInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">
                            {userName}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-mono truncate">
                            {userEmail}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              {userRole}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="p-3 space-y-1.5 text-[11px] text-zinc-400 font-mono">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-950/50">
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          Platform Scope:
                        </span>
                        <span className="text-zinc-200 font-bold">Root Governance</span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-950/50">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-400" />
                          Session Status:
                        </span>
                        <span className="text-emerald-400 font-semibold">Active (7 Days)</span>
                      </div>
                    </div>

                    {/* Logout Action */}
                    <div className="p-2 border-t border-zinc-800/80">
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Keluar dari Super Admin</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Header Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-rose-950/40 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/50 text-zinc-400 text-xs font-semibold transition-all cursor-pointer"
              title="Keluar dari Super Admin"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Standalone Fallback Logout Confirmation Modal */}
      {!onRequestLogout && (
        <AdminLogoutModal
          isOpen={internalLogoutOpen}
          onClose={() => {
            if (!isInternalLoggingOut) setInternalLogoutOpen(false);
          }}
          onConfirm={handleStandaloneLogoutConfirm}
          isPending={isInternalLoggingOut}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
        />
      )}
    </>
  );
}
