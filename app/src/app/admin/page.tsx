import prisma from "@/lib/prisma";
import Link from "next/link";
import { Shield, Building2, Users, ExternalLink, LogOut, Activity, Database, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const tenants = await prisma.tenant.findMany({
    include: {
      users: { select: { email: true, name: true, role: true } },
      _count: {
        select: {
          jobFiles: true,
          invoices: true,
          vendors: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 sm:p-10">
      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto flex items-center justify-between pb-8 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white leading-tight">
              Sistem Forwarding &bull; Super Admin Console
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              admin.sistemforwarding.com &bull; Root Platform Governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SaaS Core Healthy</span>
          </div>

          <Link
            href="/api/auth/logout"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-rose-950/50 hover:border-rose-800/80 hover:text-rose-300 text-zinc-400 text-xs font-semibold transition-all"
            title="Keluar dari Super Admin"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto pt-8 space-y-8">
        {/* KPI Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Active Tenants</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">{tenants.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Multi-Tenant PostgreSQL Isolation</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Database Clusters</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-white">PostgreSQL 16</p>
            <p className="text-xs text-zinc-500 mt-1">Docker Internal Network Attached</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Wildcard Gateway</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white">Nginx 1.31 + SSL</p>
            <p className="text-xs text-zinc-500 mt-1">*.sistemforwarding.com Live</p>
          </div>
        </div>

        {/* Tenant Management Table */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Daftar Tenant Ruang Kerja Klien</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pengelolaan hak akses, domain mandiri, dan inspeksi operasional.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/60 border-b border-zinc-800 text-xs text-zinc-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Perusahaan / Tenant</th>
                  <th className="py-3.5 px-6">Subdomain</th>
                  <th className="py-3.5 px-6">Administrator</th>
                  <th className="py-3.5 px-6">Paket / Status</th>
                  <th className="py-3.5 px-6">Job Files</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-amber-400">
                          {t.companyName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p>{t.companyName}</p>
                          <p className="text-xs text-zinc-500 font-mono">{t.legalName || "-"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono text-xs text-blue-400">
                      https://{t.subdomain}.sistemforwarding.com
                    </td>

                    <td className="py-4 px-6 text-xs">
                      <p className="text-zinc-200 font-medium">{t.users[0]?.name || "-"}</p>
                      <p className="text-zinc-500 font-mono">{t.users[0]?.email || "-"}</p>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/50 border border-amber-800/60 text-amber-400 text-xs font-bold">
                        <CheckCircle2 className="w-3 h-3 text-amber-400" />
                        {t.subscriptionTier}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono text-xs">
                      {t._count.jobFiles} files
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`https://${t.subdomain}.sistemforwarding.com`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all border border-zinc-700 hover:border-zinc-600"
                      >
                        <span>Kunjungi Portal</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
