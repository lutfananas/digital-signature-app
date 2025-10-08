import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aplikasi Tanda Tangan Digital",
  description: "Aplikasi tanda tangan digital yang mudah digunakan untuk menandatangani dokumen PDF dan gambar",
  keywords: ["tanda tangan digital", "PDF", "dokumen", "signature", "Next.js", "TypeScript"],
  authors: [{ name: "Digital Signature App" }],
  openGraph: {
    title: "Aplikasi Tanda Tangan Digital",
    description: "Tanda tangan dokumen secara digital dengan mudah dan cepat",
    url: "https://chat.z.ai",
    siteName: "Digital Signature App",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aplikasi Tanda Tangan Digital",
    description: "Tanda tangan dokumen secara digital dengan mudah dan cepat",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Sonner />
      </body>
    </html>
  );
}
