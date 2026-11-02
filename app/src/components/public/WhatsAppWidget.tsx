"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, Sparkles, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

const WA_NUMBER = "6281122823696";

const QUICK_TOPICS = {
  id: [
    {
      label: "Tanya Paket & Harga",
      icon: "💰",
      text: "Halo CS Sistem Forwarding, saya ingin konsultasi mengenai paket harga dan rincian fitur software untuk perusahaan forwarder kami.",
    },
    {
      label: "Jadwalkan Live Demo",
      icon: "🖥️",
      text: "Halo CS Sistem Forwarding, saya ingin menjadwalkan sesi presentasi / live demo sistem untuk tim operasional kami.",
    },
    {
      label: "Fitur BL, AWB & Pajak PPN",
      icon: "📄",
      text: "Halo CS Sistem Forwarding, saya ingin tanya seputar modul pembuatan draft B/L, AWB, dan otomasi invoice PPN 1.1%.",
    },
  ],
  en: [
    {
      label: "Pricing & Plans",
      icon: "💰",
      text: "Hello Sistem Forwarding CS, I would like to consult regarding pricing packages and software features for our forwarding company.",
    },
    {
      label: "Schedule Live Demo",
      icon: "🖥️",
      text: "Hello Sistem Forwarding CS, I would like to schedule a system presentation / live demo session for our operations team.",
    },
    {
      label: "BL, AWB & VAT Modules",
      icon: "📄",
      text: "Hello Sistem Forwarding CS, I would like to inquire about draft B/L & AWB generation and automated 1.1% logistics VAT invoicing.",
    },
  ],
};

export function WhatsAppWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPublicDomain, setIsPublicDomain] = useState(true);
  const [showPill, setShowPill] = useState(true);
  const { lang } = useLanguage();
  const t = translations[lang].whatsapp;
  const currentTopics = QUICK_TOPICS[lang] || QUICK_TOPICS.id;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host.toLowerCase();
      // Only render on root domain or www (exclude admin and tenant subdomains)
      if (
        host.startsWith("admin.") ||
        (host.endsWith("sistemforwarding.com") && !host.startsWith("www.") && host !== "sistemforwarding.com")
      ) {
        setIsPublicDomain(false);
      }
    }
  }, []);

  if (!isPublicDomain || pathname.startsWith("/admin")) {
    return null;
  }

  const handleOpenWhatsApp = (messageText?: string) => {
    const defaultMsg =
      lang === "en"
        ? "Hello Sistem Forwarding Customer Service, I am interested in consulting about your cargo & freight forwarding software."
        : "Halo Customer Service Sistem Forwarding, saya tertarik berkonsultasi mengenai implementasi software kargo & freight forwarding.";
    const textToSend = messageText || defaultMsg;
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Expanded Interactive Card Popup */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-40px)] sm:w-96 rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Tutup popup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center font-black text-lg shadow-md">
                  SF
                </div>
                {/* Active indicator dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">{t.csRole}</h3>
                <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>{t.onlineHours}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 bg-slate-50 space-y-4">
            {/* Greeting chat bubble */}
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-sm border border-slate-200/80 shadow-xs text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span>{lang === "en" ? "Hello! 👋" : "Halo! 👋"}</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {lang === "en" ? "Sistem Forwarding Team" : "Tim Sistem Forwarding"}
                </span>
              </p>
              {t.greetingMessage}
            </div>

            {/* Quick action buttons */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                {lang === "en" ? "Select Inquiries Topic:" : "Pilih Topik Konsultasi:"}
              </p>
              {currentTopics.map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleOpenWhatsApp(topic.text)}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 active:bg-emerald-100/70 border border-slate-200/90 hover:border-emerald-300 text-xs font-semibold text-slate-800 transition-all flex items-center justify-between group shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{topic.icon}</span>
                    <span>{topic.label}</span>
                  </span>
                  <Send className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </button>
              ))}
            </div>

            {/* Direct WhatsApp CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenWhatsApp()}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {/* Official WhatsApp SVG */}
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>{t.chatButton}</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {lang === "en"
                  ? "Fast Response • Confidential & Direct Discussion"
                  : "Respon Cepat • Diskusi Rahasia & Langsung"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Circular Trigger Button + Pill */}
      <div className="flex items-center gap-2.5">
        {/* Teaser Pill Badge */}
        {!isOpen && showPill && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 py-2 px-3.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl cursor-pointer hover:border-emerald-400 transition-all hover:scale-105 group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
              {lang === "en" ? "Chat CS via WhatsApp" : "Hubungi CS via WhatsApp"}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPill(false);
              }}
              className="text-slate-400 hover:text-slate-600 ml-1 p-0.5 rounded-full"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* The Main Round Green Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Buka obrolan WhatsApp Customer Service"
          title="WhatsApp Customer Service"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/35 border border-white/20 transition-all duration-300 hover:scale-105 focus:outline-none"
        >
          {isOpen ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200 rotate-90" />
          ) : (
            <>
              {/* WhatsApp Icon */}
              <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>

              {/* Pulsing Green Glow Ring */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white"></span>
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
