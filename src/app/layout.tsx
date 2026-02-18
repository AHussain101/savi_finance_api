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
  title: "VaultLine — One API for Every Financial Rate on Earth",
  description:
    "Fiat. Crypto. Stocks. Metals. One key. One schema. One bill. The unified financial data infrastructure layer for the embedded finance era.",
  openGraph: {
    title: "VaultLine — One API for Every Financial Rate on Earth",
    description:
      "Stop juggling 5 API subscriptions. Fiat, crypto, stocks, and metals — unified under one key, one schema, one bill.",
    type: "website",
    url: "https://vaultline.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "VaultLine — One API for Every Financial Rate on Earth",
    description:
      "Stop juggling 5 API subscriptions. Ship in hours, not weeks.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
