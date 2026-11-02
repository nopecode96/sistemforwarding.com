"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminLogoutModal } from "./AdminLogoutModal";
import { logoutAction } from "@/lib/auth-actions";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export interface AdminSessionUser {
  name?: string;
  email?: string;
  role?: string;
  tenantId?: string | null;
  companyName?: string | null;
}

interface AdminLayoutShellProps {
  children: React.ReactNode;
  tenantsCount?: number;
  session?: AdminSessionUser | null;
}

export function AdminLayoutShell({
  children,
  tenantsCount = 0,
  session,
}: AdminLayoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    const host = typeof window !== "undefined" ? window.location.host : "";
    const isAdminSubdomain = host.startsWith("admin.");
    const isDirectAdminPath = pathname.startsWith("/admin");
    const targetLogin = isAdminSubdomain ? "/login" : isDirectAdminPath ? "/admin/login" : "/login";

    try {
      await logoutAction();
    } catch (error) {
      console.error("[AdminLayoutShell] Logout action error:", error);
    }

    // Redirect through /api/auth/logout to guarantee cookie deletion across wildcard domain and host
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/auth/logout?redirect=${encodeURIComponent(targetLogin)}`;
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">
        {/* Super Admin Sidebar */}
        <AdminSidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          tenantsCount={tenantsCount}
          session={session}
          onRequestLogout={() => setLogoutModalOpen(true)}
        />

        {/* Main Content Area */}
        <div className="lg:pl-72 flex flex-col flex-1 min-w-0">
          <AdminHeader
            onOpenMobile={() => setMobileMenuOpen(true)}
            session={session}
            onRequestLogout={() => setLogoutModalOpen(true)}
          />

          {/* Child Content Viewport with responsive inner container padding */}
          <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 flex flex-col overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
              {children}
            </div>
          </main>
        </div>

        {/* Logout Confirmation Modal */}
        <AdminLogoutModal
          isOpen={logoutModalOpen}
          onClose={() => {
            if (!isLoggingOut) setLogoutModalOpen(false);
          }}
          onConfirm={handleConfirmLogout}
          isPending={isLoggingOut}
          userName={session?.name}
          userEmail={session?.email}
          userRole={session?.role}
        />
      </div>
    </ThemeProvider>
  );
}
