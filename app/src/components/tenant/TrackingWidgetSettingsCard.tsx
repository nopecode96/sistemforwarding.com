'use client';

import { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Globe,
  Terminal,
  Layers,
} from 'lucide-react';

interface TrackingWidgetSettingsCardProps {
  subdomain: string;
  companyName: string;
}

export function TrackingWidgetSettingsCard({
  subdomain,
  companyName,
}: TrackingWidgetSettingsCardProps) {
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const publicUrl = `https://${subdomain}.sistemforwarding.com/track`;
  const embedUrl = `https://${subdomain}.sistemforwarding.com/track?embed=true`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="650"
  style="border:none; border-radius:16px; width:100%; min-height:650px;"
  title="Lacak Kiriman - ${companyName}"
></iframe>`;

  const apiSnippet = `curl -X GET "https://${subdomain}.sistemforwarding.com/api/${subdomain}/track?q=NOMOR_AWB_ATAU_BL" \\
  -H "Accept: application/json"`;

  const handleCopy = (text: string, type: 'iframe' | 'url' | 'api') => {
    navigator.clipboard.writeText(text);
    if (type === 'iframe') {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2500);
    } else if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } else {
      setCopiedApi(true);
      setTimeout(() => setCopiedApi(false), 2500);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-xs space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Widget Lacak Kiriman &amp; Integrasi Website
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                No-Code Embed
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sediakan alat pelacakan kargo real-time langsung di website resmi perusahaan Anda
              tanpa perlu login.
            </p>
          </div>
        </div>

        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shrink-0"
        >
          <span>Buka Halaman Lacak</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Direct Link Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            URL Halaman Pelacakan Publik (White-Label):
          </span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
            {publicUrl}
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleCopy(publicUrl, 'url')}
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-blue-400 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
        >
          {copiedUrl ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Tautan</span>
            </>
          )}
        </button>
      </div>

      {/* Option A: Iframe Snippet Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Kode Iframe Embed (Tempel di Website Anda):
            </h4>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(iframeCode, 'iframe')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shadow-blue-600/30"
          >
            {copiedIframe ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Kode Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kode HTML</span>
              </>
            )}
          </button>
        </div>

        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-blue-300 overflow-x-auto shadow-inner">
          <pre className="whitespace-pre">{iframeCode}</pre>
        </div>

        {/* How to use steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>1.</span> Buat Halaman Baru
            </span>
            <p className="text-slate-500 leading-relaxed">
              Buat halaman baru di website Anda, misalnya: <code>/tracking</code> atau <code>/lacak-resi</code>.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>2.</span> Masukkan Custom HTML
            </span>
            <p className="text-slate-500 leading-relaxed">
              Di WordPress, Elementor, Webflow, atau Wix, tambahkan blok / widget <strong>Custom HTML / Embed</strong>.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>3.</span> Tempel Kode Iframe
            </span>
            <p className="text-slate-500 leading-relaxed">
              Tempel kode iframe di atas lalu publikasikan. Widget pelacakan Anda langsung aktif live!
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview Toggle Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowPreview((prev) => !prev)}
          className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4 text-slate-500" />
              <span>Sembunyikan Pratinjau Widget</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Lihat Pratinjau Langsung (Live Preview Widget)</span>
            </>
          )}
        </button>

        {showPreview && (
          <div className="mt-4 p-2 sm:p-4 rounded-3xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-white/10 text-[11px] text-slate-500">
              <span className="font-semibold">Simulasi Embed di Website Perusahaan Anda:</span>
              <span className="font-mono text-[10px]">100% Responsive Frame</span>
            </div>
            <iframe
              src={embedUrl}
              className="w-full h-[650px] rounded-2xl border border-slate-200/80 bg-white shadow-md"
              title={`Preview Tracking - ${companyName}`}
            />
          </div>
        )}
      </div>

      {/* Option B: REST API Snippet for Developers (Bonus) */}
      <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Opsi REST API (Untuk Integrasi Programmer / Developer):
            </h5>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(apiSnippet, 'api')}
            className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            {copiedApi ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Salin cURL</span>
              </>
            )}
          </button>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
          <code>{apiSnippet}</code>
        </div>
      </div>
    </div>
  );
}
