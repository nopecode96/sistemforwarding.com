"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Settings,
  Menu,
  X,
  Ship,
  Bell,
  ChevronRight,
  LogOut,
  Building2,
  Search,
  Sun,
  Moon,
  Layers,
  BarChart3,
  Users,
  Truck,
} from "lucide-react";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { TenantBroadcastBanner } from "./TenantBroadcastBanner";
import { logoutAction } from "@/lib/auth-actions";

interface TenantShellProps {
  tenant: string;
  companyName: string;
  subscriptionStatus?: string;
  logoUrl?: string | null;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  isImpersonating?: boolean;
  children: React.ReactNode;
}

function TenantShellContent({
  tenant,
  companyName,
  subscriptionStatus = "ACTIVE",
  logoUrl,
  userName = "Admin Operasional",
  userEmail,
  userRole = "Tenant Admin",
  isImpersonating = false,
  children,
}: TenantShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme, toggleTheme, setTheme } = useTheme();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutAction();
    } catch (err) {
      console.error("[TenantShell] Logout error:", err);
    }
    window.location.href = "/api/auth/logout";
  };

  const displayLogo = logoUrl && logoUrl.trim() !== "" ? logoUrl : "/logo.png";
  const displayEmail = userEmail || `${tenant}@sistemforwarding.com`;
  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "AD";

  const navigation = [
    {
      name: "Dashboard Operasional",
      href: "/",
      icon: LayoutDashboard,
      current: pathname === "/" || pathname === `/${tenant}` || pathname === `/${tenant}/`,
    },
    {
      name: "Manajemen Job File",
      href: "/jobs",
      icon: Ship,
      current:
        pathname.startsWith("/jobs") ||
        pathname.startsWith(`/${tenant}/jobs`) ||
        pathname.startsWith("/job-files"),
      badge: "Live",
    },
    {
      name: "Keuangan & Billing",
      href: "/finance",
      icon: Wallet,
      current:
        (pathname.startsWith("/finance") || pathname.startsWith(`/${tenant}/finance`)) &&
        !pathname.includes("/reports"),
    },
    {
      name: "Laporan Keuangan",
      href: "/finance/reports",
      icon: BarChart3,
      current:
        pathname.includes("/finance/reports") ||
        pathname.includes(`/${tenant}/finance/reports`),
    },
    {
      name: "Data Customer",
      href: "/customers",
      icon: Building2,
      current:
        pathname.startsWith("/customers") ||
        pathname.startsWith(`/${tenant}/customers`),
    },
    {
      name: "Mitra Vendor",
      href: "/vendors",
      icon: Truck,
      current:
        pathname.startsWith("/vendors") ||
        pathname.startsWith(`/${tenant}/vendors`),
    },
    {
      name: "Master Data & Referensi",
      href: "/master",
      icon: Layers,
      current: pathname.startsWith("/master") || pathname.startsWith(`/${tenant}/master`),
    },
    {
      name: "Data User & Akses",
      href: "/users",
      icon: Users,
      current: pathname.startsWith("/users") || pathname.startsWith(`/${tenant}/users`),
    },
    {
      name: "Konfigurasi & Setting",
      href: "/settings",
      icon: Settings,
      current: pathname.startsWith("/settings") || pathname.startsWith(`/${tenant}/settings`),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-[#0b0e14] text-slate-900 dark:text-slate-100 font-sans flex flex-col lg:flex-row transition-colors duration-200">
      {/* ==================================================================== */}
      {/* MOBILE DRAWER OVERLAY & SIDEBAR */}
      {/* ==================================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-[#121620] pb-4 pt-5 shadow-2xl z-10 border-r border-slate-200 dark:border-white/10 animate-in slide-in-from-left duration-200">
            {/* Header in Drawer */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100 dark:border-white/10">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Image
                  src={displayLogo}
                  alt={companyName || "Logo"}
                  width={150}
                  height={50}
                  className="h-8 w-auto max-w-[140px] object-contain dark:brightness-110"
                  priority
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Theme Switcher Pill */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Mode Tampilan
              </span>
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    theme === "light"
                      ? "bg-white text-amber-600 shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    theme === "dark"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Gelap</span>
                </button>
              </div>
            </div>

            {/* Tenant Identity */}
            <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {companyName ? companyName.substring(0, 2).toUpperCase() : "SF"}
                </div>
                <div className="truncate">
                  <h1 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {companyName}
                  </h1>
                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate block">
                    {tenant}.sistemforwarding.com
                  </span>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <div className="mt-4 flex-1 px-3 space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      item.current
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/20 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Footer */}
            <div className="border-t border-slate-100 dark:border-white/10 p-4 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-violet-950/80 border border-indigo-200 dark:border-violet-500/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-violet-300">
                    {userInitials}
                  </div>
                  <div className="truncate max-w-[130px]">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {displayEmail}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-100 dark:border-rose-900/40 transition-colors cursor-pointer disabled:opacity-50"
                  title="Keluar dari sistem"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DESKTOP SOPHISTICATED FLOATING SIDEBAR (CargoSync & Dark UI Inspiration) */}
      {/* ==================================================================== */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0 bg-white/90 dark:bg-[#0f131c]/95 backdrop-blur-md border-r border-slate-200/80 dark:border-white/[0.08] min-h-screen z-20">
        {/* Brand & Theme Switcher Capsule (Image 2 style) */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          <Link href="/" className="inline-block group">
            <Image
              src={displayLogo}
              alt={companyName || "Logo"}
              width={160}
              height={50}
              className="h-8 w-auto max-w-[145px] object-contain transition-transform group-hover:scale-105 dark:brightness-110"
              priority
            />
          </Link>

          {/* Capsule Light / Dark Toggle Switch (CargoSync Image 2 style) */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#1a2130] border border-slate-200/80 dark:border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setTheme("light")}
              title="Aktifkan Mode Terang (Light Mode)"
              className={`p-1.5 rounded-xl transition-all ${
                theme === "light"
                  ? "bg-white text-amber-500 shadow-sm shadow-slate-200"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              title="Aktifkan Mode Gelap (Dark Mode)"
              className={`p-1.5 rounded-xl transition-all ${
                theme === "dark"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-500/40"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Tenant Workspace Identifier */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-white/[0.04] dark:to-white/[0.01] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-500/20 shrink-0">
              {companyName ? companyName.substring(0, 2).toUpperCase() : "SF"}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-500/30 rounded-full">
                  {subscriptionStatus}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Enterprise</span>
              </div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate mt-0.5" title={companyName}>
                {companyName}
              </h2>
              <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate">
                {tenant}.sistemforwarding.com
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items (Pill Style) */}
        <nav className="flex-1 px-3 space-y-1 mt-1">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
            Menu Operasional
          </p>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  item.current
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 dark:shadow-violet-900/40"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
                      item.current
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                      item.current
                        ? "bg-white/20 text-white"
                        : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`h-3.5 w-3.5 opacity-0 transition-opacity ${
                      item.current ? "opacity-100 text-white/80" : "group-hover:opacity-70 text-slate-400"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Live Cluster Status (Image 3 Style) */}
        <div className="mx-3 mb-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141923] border border-slate-200/80 dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Cluster Operational
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-500/20">
              Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Data terisolasi PostgreSQL 16 &amp; Nginx Multi-Tenant
          </p>
        </div>

        {/* User Profile Card */}
        <div className="p-3.5 border-t border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#0f131c]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                {userInitials}
              </div>
              <div className="truncate max-w-[120px]">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {userRole}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Keluar dari Ruang Kerja"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-100 dark:border-rose-900/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MAIN VIEWPORT (HEADER + SOPHISTICATED CONTENT) */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header with Omni-Search & View Switchers */}
        <header
          className={`sticky ${
            isImpersonating ? "top-[44px]" : "top-0"
          } z-30 flex h-14 sm:h-16 items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0b0e14]/95 px-3 sm:px-6 lg:px-8 backdrop-blur-md transition-colors w-full`}
        >
          {/* Left: Mobile Toggle & Mobile Logo & Global Omni Search */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden shrink-0"
              aria-label="Buka Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Header Brand Logo */}
            <Link href="/" className="lg:hidden flex items-center shrink-0">
              <Image
                src={displayLogo}
                alt={companyName || "Logo"}
                width={120}
                height={32}
                className="h-6 w-auto max-w-[105px] object-contain dark:brightness-110"
              />
            </Link>

            {/* Omni Search Bar (Desktop only) */}
            <div className="relative w-full hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Job File, No. BL, Kontainer, Shipper... (⌘K)"
                className="w-full pl-10 pr-12 py-2 text-xs rounded-2xl bg-slate-100/90 dark:bg-[#141923] border border-slate-200/70 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/10">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right: Operational Status, Quick Tabs, Theme Button, Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Quick Action Tabs (Overview, Jobs, Customer, Vendor, Master) */}
            <div className="hidden xl:flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-[#141923] border border-slate-200/80 dark:border-white/[0.08]">
              <Link
                href="/"
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/" || pathname === `/${tenant}`
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Overview
              </Link>
              <Link
                href="/jobs"
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  pathname.startsWith("/jobs") || pathname.startsWith(`/${tenant}/jobs`)
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Job Files
              </Link>
              <Link
                href="/finance"
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  (pathname.startsWith("/finance") || pathname.startsWith(`/${tenant}/finance`)) &&
                  !pathname.includes("/reports")
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Finance
              </Link>
              <Link
                href="/finance/reports"
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  pathname.includes("/finance/reports") || pathname.includes(`/${tenant}/finance/reports`)
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Laporan
              </Link>
              <Link
                href="/customers"
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  pathname.startsWith("/customers") || pathname.startsWith(`/${tenant}/customers`)
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Customer
              </Link>
              <Link
                href="/vendors"
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  pathname.startsWith("/vendors") || pathname.startsWith(`/${tenant}/vendors`)
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Vendor
              </Link>
              <Link
                href="/master"
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  pathname.startsWith("/master") || pathname.startsWith(`/${tenant}/master`)
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Master Data
              </Link>
            </div>

            {/* Live Operational Beacon */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Live Cluster</span>
            </div>

            {/* Sun/Moon Toggle in Header */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Beralih ke mode ${theme === "dark" ? "terang" : "gelap"}`}
              className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-1.5 sm:p-2 rounded-xl sm:rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 transition-colors"
              title="Notifikasi Operasional"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 h-2 w-2 rounded-full bg-violet-600 ring-2 ring-white dark:ring-[#0b0e14]" />
            </button>

            {/* User Profile Avatar & Header Quick Logout */}
            <div className="flex items-center gap-2 pl-0.5 sm:pl-1">
              <div
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-violet-500/20"
                title={`${userName} (${userRole})`}
              >
                {userInitials}
              </div>

              {/* Header Logout Action */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Keluar dari sistem (Logout)"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-800/40 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{isLoggingOut ? "Keluar..." : "Keluar"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Platform Broadcast Announcement Banner */}
        <TenantBroadcastBanner subdomain={tenant} />

        {/* Child Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 bg-[#f4f6fa] dark:bg-[#0b0e14] transition-colors overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export function TenantShell(props: TenantShellProps) {
  return (
    <ThemeProvider>
      <TenantShellContent {...props} />
    </ThemeProvider>
  );
}
