import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MDASH",
  description: "Track your portfolio across Hyperliquid, Polymarket & Football.fun",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MDASH",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-zinc-950 text-white min-h-screen font-sans`}
      >
        {/* Desktop Nav */}
        <Nav />
        
        {/* Mobile Header */}
        <MobileHeader />
        
        {/* Main Content - with bottom padding for mobile nav */}
        <main className="pb-20 md:pb-0">
          {children}
        </main>
        
        {/* Mobile Bottom Nav */}
        <MobileNav />
      </body>
    </html>
  );
}
