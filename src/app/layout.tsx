import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/lib/theme-styles"; // Load active theme CSS
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import { theme } from "@/lib/theme";

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
      <body>
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
