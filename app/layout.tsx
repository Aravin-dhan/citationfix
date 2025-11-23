import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CitationFix - Convert Inline Citations to Footnotes",
  description: "Turn inline citations into clean footnotes instantly. Perfect for law students, researchers, and academics. Paste text with {{fn: ...}} markers and get Word-ready footnotes.",
  keywords: ["citations", "footnotes", "legal citations", "academic writing", "research tools", "Bluebook", "OSCOLA"],
  authors: [{ name: "CitationFix" }],
  openGraph: {
    title: "CitationFix - Convert Inline Citations to Footnotes",
    description: "Turn inline citations into clean footnotes instantly. Perfect for law students, researchers, and academics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
