import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/theme-styles"; // Load active theme CSS
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import { theme } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: theme.meta.title,
  description: theme.meta.description,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: theme.brand.name,
  },
  openGraph: {
    title: theme.meta.title,
    description: theme.meta.description,
    siteName: theme.brand.name,
  },
  icons: {
    icon: theme.assets.favicon,
    apple: theme.assets.appleTouchIcon,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: theme.colors.primary,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
