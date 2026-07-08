"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "risalah-cookie-consent";

type ConsentChoice = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentChoice>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentChoice;
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
    setConsent(stored);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setConsent("rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-surface-container bg-surface/95 shadow-lg backdrop-blur-[12px] p-4 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-on-surface">
              Pengaturan Cookie
            </p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Kami menggunakan cookie untuk memastikan Anda mendapatkan pengalaman terbaik
              di aplikasi SEKNEG AI. Cookie digunakan untuk sesi autentikasi, preferensi
              pengguna, dan analitik internal. Dengan melanjutkan, Anda menyetujui
              penggunaan cookie sesuai dengan Kebijakan Privasi kami.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={reject}>
              Tolak
            </Button>
            <Button size="sm" onClick={accept}>
              Setuju
            </Button>
          </div>
          <button
            onClick={reject}
            className="shrink-0 text-on-surface-variant hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
