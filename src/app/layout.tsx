import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "KaloriyaAI — ovqat kaloriyasini rasmdan aniqlash",
  description: "Ovqatni rasmga oling va sun'iy intellekt yordamida kaloriya, oqsil, yog' va uglevodlarni bir zumda biling.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "KaloriyaAI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${inter.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
