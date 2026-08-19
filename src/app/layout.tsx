import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Absolute — Your Cinema. Quantified.",
    template: "%s | Absolute",
  },
  description:
    "Import your viewing history and discover what your taste says about you. Beautiful analytics, honest statistics, zero paywalls.",
  keywords: ["movies", "cinema", "statistics", "viewing history", "film analytics", "movie tracker"],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Absolute — Your Cinema. Quantified.",
    description: "Import your viewing history and discover what your taste says about you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bebasNeue.variable} ${inter.variable}`}
    >
      <body className="min-h-screen bg-ink-950 text-smoke-100 antialiased">
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
