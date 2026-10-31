"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export function GooglePopupCallback() {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Hanya berjalan jika berada di dalam window popup (dibuka oleh window.opener)
    if (typeof window === "undefined" || !window.opener) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const hash = window.location.hash;

    // A. Handle OAuth Code Flow
    if (code) {
      setIsProcessing(true);

      const isProduction = window.location.hostname.includes("sistemforwarding.com");
      const redirectUri = isProduction
        ? "https://www.sistemforwarding.com"
        : window.location.origin;

      fetch("/api/auth/google/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            window.opener.postMessage(
              {
                type: "GOOGLE_AUTH_SUCCESS",
                user: data.user,
              },
              "*"
            );
            setTimeout(() => {
              window.close();
            }, 600);
          } else {
            console.error("Gagal verifikasi code Google:", data.error);
            window.opener.postMessage(
              {
                type: "GOOGLE_AUTH_ERROR",
                error: data.error || "Gagal verifikasi Google",
              },
              "*"
            );
            setTimeout(() => {
              window.close();
            }, 1200);
          }
        })
        .catch((err) => {
          console.error("Popup exchange error:", err);
          window.close();
        });
      return;
    }

    // B. Handle Token Implicit Flow (hash #access_token=...)
    if (hash && hash.includes("access_token=")) {
      setIsProcessing(true);
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get("access_token");

      if (accessToken) {
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .then((userData) => {
            window.opener.postMessage(
              {
                type: "GOOGLE_AUTH_SUCCESS",
                user: {
                  name: userData.name || userData.email,
                  email: userData.email,
                  avatarUrl: userData.picture || "https://lh3.googleusercontent.com/a/default-user=s96-c",
                },
              },
              "*"
            );
            setTimeout(() => {
              window.close();
            }, 600);
          })
          .catch((err) => {
            console.error("Userinfo fetch error:", err);
            window.close();
          });
      }
    }
  }, []);

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-md">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">
        Login Google Berhasil
      </h3>
      <p className="text-xs text-slate-500">
        Menghubungkan akun ke formulir ruang kerja...
      </p>
    </div>
  );
}
