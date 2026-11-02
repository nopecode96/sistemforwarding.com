"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface AdminBreadcrumb {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: "amber" | "emerald" | "blue" | "purple" | "rose";
  breadcrumbs?: AdminBreadcrumb[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const badgeStyles = {
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

export function AdminPageHeader({
  title,
  description,
  badge,
  badgeVariant = "amber",
  breadcrumbs,
  actions,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 space-y-3">
      {/* Optional Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 shrink-0" />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-semibold text-slate-900 dark:text-white" : ""}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {badge && (
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${badgeStyles[badgeVariant]}`}
              >
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
