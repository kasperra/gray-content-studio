import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Brand display face — bold, wide, modern (Google-Fonts stand-in for "Horizon").
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-archivo",
  display: "swap",
});

// Brand body face — clean, professional grotesque (stand-in for "Telegraf").
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // "./" resolves per-route, so every page gets a self-referencing canonical
  // instead of leaving the choice of hostname to the crawler.
  alternates: { canonical: "./" },
  title: {
    default: "Gray Content Studio — Video Production, Editing & Animation",
    template: "%s — Gray Content Studio",
  },
  description:
    "Gray Content Studio crafts cinematic video content for Fortune 500 brands, campaigns, and creators — production, editing, and 2D animation trusted by ExxonMobil, Anthem, iHeartRadio, and more.",
  openGraph: {
    type: "website",
    siteName: "Gray Content Studio",
    images: ["/img/iheart.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  );
}
