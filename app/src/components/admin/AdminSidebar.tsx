"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Building2,
  Layers,
  Database,
  LogOut,
  ExternalLink,
  X,
  Server,
  Lock,
  Compass,
  CreditCard,
  Receipt,
  BookOpen,
  Megaphone,
  BarChart3,
  Globe,
  Users,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";
import { getUserInitials } from "@/lib/auth-utils";
import { AdminLogoutModal } from "./AdminLogoutModal";
import type { AdminSessionUser } from "./AdminLayoutShell";

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  tenantsCount?: number;
  session?: AdminSessionUser | null;
  onRequestLogout?: () => void;
}

export function AdminSidebar({
  mobileOpen,
  onCloseMobile,
  tenantsCount = 0,
  session,
  onRequestLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [internalLogoutOpen, setInternalLogoutOpen] = useState(false);
  const [isInternalLoggingOut, setIsInternalLoggingOut] = useState(false);

  const isDirectAdminPath = pathname.startsWith("/admin");
  const basePath = isDirectAdminPath ? "/admin" : "";

  const userName = session?.name?.trim() || "Super Administrator";
  const userEmail = session?.email?.trim() || "superadmin@sistemforwarding.com";
  const userRole = session?.role?.trim() || "SUPERADMIN";
  const userInitials = getUserInitials(userName, "SA");

  const handleLogoutClick = () => {
    onCloseMobile();
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
      console.error("[AdminSidebar] Logout error:", error);
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/auth/logout?redirect=${encodeURIComponent(targetLogin)}`;
  };

  const isAnalytics =
    pathname === "/" ||
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname === "/analytics" ||
    pathname.startsWith("/analytics/") ||
    pathname === "/admin/analytics" ||
    pathname.startsWith("/admin/analytics/");
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
  const isAffiliates =
    pathname === "/affiliates" ||
    pathname.startsWith("/affiliates/") ||
    pathname === "/admin/affiliates" ||
    pathname.startsWith("/admin/affiliates/");

  const navItems = [
    {
      name: "Eksekutif Analitik",
      href: `${basePath}/analytics`,
      icon: BarChart3,
      current: isAnalytics,
      badge: "Realtime",
    },
    {
      name: "Manajemen Tenant",
      href: `${basePath}/tenants`,
      icon: Building2,
      current: isTenants,
      badge: tenantsCount > 0 ? `${tenantsCount}` : undefined,
    },
    {
      name: "Program Afiliasi",
      href: `${basePath}/affiliates`,
      icon: Users,
      current: isAffiliates,
      badge: "B2B",
    },
    {
      name: "Paket Langganan",
      href: `${basePath}/plans`,
      icon: CreditCard,
      current: isPlans,
    },
    {
      name: "SaaS Billing & Invoices",
      href: `${basePath}/billing`,
      icon: Receipt,
      current: isBilling,
    },
    {
      name: "Master Data Global",
      href: `${basePath}/master-data`,
      icon: Globe,
      current: isMasterData,
    },
    {
      name: "Artikel & CMS",
      href: `${basePath}/articles`,
      icon: BookOpen,
      current: isArticles,
    },
    {
      name: "Broadcast Pengumuman",
      href: `${basePath}/broadcasts`,
      icon: Megaphone,
      current: isBroadcasts,
    },
    {
      name: "Audit & Keamanan",
      href: `${basePath}/audit`,
      icon: Lock,
      current: isAudit,
      badge: "Edge",
    },
    {
      name: "Infrastruktur & Node",
      href: `${basePath}/system`,
      icon: Server,
      current: isSystem,
      badge: "Kesehatan",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Top Header */}
        <div className="p-6 border-b border-zinc-800/70">
          <div className="flex items-center justify-between">
            <Link
              href={`${basePath}/analytics`}
              className="flex items-center gap-3 group"
              onClick={onCloseMobile}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-red-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white tracking-tight">
                    Sistem Forwarding
                  </span>
                </div>
                <p className="text-[11px] font-mono font-medium text-amber-400">
                  Super Admin Console
                </p>
              </div>
            </Link>

            {/* Close button on mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px]">
            <span className="text-zinc-400 font-mono">admin.sistemforwarding.com</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PROD
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Platform Governance
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  item.current
                    ? "bg-gradient-to-r from-amber-500/15 to-transparent text-amber-400 border border-amber-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      item.current ? "text-amber-400" : "text-zinc-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      item.current
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Akses Eksternal
          </div>

          <a
            href="https://sistemforwarding.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 transition-all border border-transparent"
          >
            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4 text-zinc-400" />
              <span>Landing Portal Klien</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>

          <div className="mt-6 p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-mono flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                PostgreSQL Cluster
              </span>
              <span className="text-emerald-400 font-bold text-[10px]">Connected</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Multi-Tenant Engine
              </span>
              <span className="text-zinc-400 font-mono text-[10px]">Active</span>
            </div>
          </div>
        </div>

        {/* Super Admin User Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60">
          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black text-xs shrink-0 shadow-md shadow-amber-500/20">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {userName}
                  </p>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                    {userRole}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono truncate mt-0.5">
                  {userEmail}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogoutClick}
              title="Keluar dari Super Admin"
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-all shrink-0 cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

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
