import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://gray-content-studio.vercel.app"
  ),
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
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
