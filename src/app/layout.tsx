import type { Metadata } from "next";
import { getSiteVariant } from "@/lib/photos/types";
import "./globals.css";

const variant = getSiteVariant();

export const metadata: Metadata =
  variant === "portfolio"
    ? {
        title: "Crète 2026 — Carnet de voyage",
        description: "Carnet visuel d'un voyage de 10 jours en Crète.",
        robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
      }
    : {
        title: "Crète 2026",
        description: "Carnet de voyage — 10 jours en Crète",
        robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
      };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  );
}
