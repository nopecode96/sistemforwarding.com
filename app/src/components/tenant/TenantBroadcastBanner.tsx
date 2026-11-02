"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminBroadcastItem,
  getActiveTenantBroadcasts,
} from "@/actions/adminBroadcastActions";
import {
  Info,
  Sparkles,
  AlertTriangle,
  Flame,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

interface TenantBroadcastBannerProps {
  subdomain?: string;
  initialBroadcasts?: AdminBroadcastItem[];
}

export function TenantBroadcastBanner({
  subdomain,
  initialBroadcasts,
}: TenantBroadcastBannerProps) {
  const [broadcasts, setBroadcasts] = useState<AdminBroadcastItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBroadcasts() {
      try {
        const data = initialBroadcasts || (await getActiveTenantBroadcasts(subdomain));
        if (!isMounted) return;

        // Filter out items already dismissed via localStorage
        const activeUndismissed = data.filter((item) => {
          try {
            return (
              typeof window !== "undefined" &&
              window.localStorage.getItem(`sf_dismissed_broadcast_${item.id}`) !== "true"
            );
          } catch {
            return true;
          }
        });

        setBroadcasts(activeUndismissed);
      } catch (err) {
        console.error("[TenantBroadcastBanner] Fetch error:", err);
      } finally {
        if (isMounted) setLoaded(true);
      }
    }

    loadBroadcasts();

    return () => {
      isMounted = false;
    };
  }, [subdomain, initialBroadcasts]);

  const handleDismiss = (id: string) => {
    try {
      localStorage.setItem(`sf_dismissed_broadcast_${id}`, "true");
    } catch (e) {
      console.warn("[TenantBroadcastBanner] LocalStorage write error:", e);
    }
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
  };

  if (!loaded || broadcasts.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-1">
      {broadcasts.map((b) => {
        let bgStyle =
          "bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 border-blue-500/40 text-blue-100";
        let iconBg = "bg-blue-500/20 text-cyan-300";
        let badgeStyle = "bg-blue-500/20 text-cyan-300 border-blue-400/30";
        let btnStyle =
          "bg-white/10 hover:bg-white/20 text-white border-white/20";
        let IconComponent = Info;

        if (b.type === "UPDATE") {
          bgStyle =
            "bg-gradient-to-r from-amber-950 via-amber-900 to-yellow-950 border-amber-500/40 text-amber-100";
          iconBg = "bg-amber-500/20 text-amber-300";
          badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-400/30";
          btnStyle =
            "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400/40 font-bold";
          IconComponent = Sparkles;
        } else if (b.type === "MAINTENANCE") {
          bgStyle =
            "bg-gradient-to-r from-rose-950 via-red-950 to-zinc-950 border-rose-500/50 text-rose-100";
          iconBg = "bg-rose-500/20 text-rose-300";
          badgeStyle = "bg-rose-500/20 text-rose-300 border-rose-400/30";
          btnStyle =
            "bg-rose-600 hover:bg-rose-500 text-white border-rose-400/40 font-bold";
          IconComponent = AlertTriangle;
        } else if (b.type === "ALERT") {
          bgStyle =
            "bg-gradient-to-r from-purple-950 via-indigo-950 to-zinc-950 border-purple-500/40 text-purple-100";
          iconBg = "bg-purple-500/20 text-purple-300";
          badgeStyle = "bg-purple-500/20 text-purple-300 border-purple-400/30";
          btnStyle =
            "bg-purple-600 hover:bg-purple-500 text-white border-purple-400/40 font-bold";
          IconComponent = Flame;
        }

        return (
          <div
            key={b.id}
            role="alert"
            className={`w-full px-4 py-2.5 border-b shadow-md transition-all ${bgStyle}`}
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              {/* Left Content */}
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeStyle}`}
                    >
                      {b.type}
                    </span>
                    <p className="font-extrabold text-white text-xs truncate">
                      {b.title}
                    </p>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed font-normal">
                    {b.message}
                  </p>
                </div>
              </div>

              {/* Right CTA & Dismiss */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {b.linkUrl && (
                  <Link
                    href={b.linkUrl}
                    target={b.linkUrl.startsWith("http") ? "_blank" : undefined}
                    className={`px-3 py-1.5 rounded-xl text-[11px] border transition-all flex items-center gap-1.5 shadow-xs ${btnStyle}`}
                  >
                    <span>{b.linkLabel || "Lihat Detail"}</span>
                    {b.linkUrl.startsWith("http") ? (
                      <ExternalLink className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => handleDismiss(b.id)}
                  title="Sembunyikan Pengumuman"
                  aria-label="Tutup Pengumuman"
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
