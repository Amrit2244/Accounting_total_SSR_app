import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
// ✅ IMPORT STEP: Default import (no curly braces)
import CommandPalette from "@/components/global/command-palette";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AS Core - ERP Solutions",
  description: "Next Gen ERP System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Added 'antialiased' for sharper text on laptops 
          and forced a smaller base text size across the app 
      */}
      <body className={`${inter.className} antialiased text-slate-900 text-sm`}>
        {/* ✅ COMPONENT STEP: Placed here so it is available globally */}
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
