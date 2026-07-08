import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "SEKNEG AI",
  description: "Platform Kecerdasan Rapat Pemerintahan",
  manifest: "/manifest.json",
  other: {
    "theme-color": "#0f172a",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${geist.variable}`}>
      <body>
        <ThemeProvider>
          {children}
          <CookieConsent />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
