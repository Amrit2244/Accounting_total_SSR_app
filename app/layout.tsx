import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AutoLogout from "@/components/AutoLogout"; // <--- 1. Import it

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Accounting App",
  description: "Financial Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. Add the component here. It's invisible but will watch for inactivity. */}
        <AutoLogout />

        {children}
      </body>
    </html>
  );
}
