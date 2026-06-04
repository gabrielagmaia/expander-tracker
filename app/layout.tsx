import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Expander Tracker",
  description: "A sweet daily tracker for your child's expander treatment",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expander",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-700 antialiased" style={{ backgroundColor: "#FFF9F4" }}>
        <AppHeader />
        <main className="max-w-lg mx-auto px-4 py-7">{children}</main>
      </body>
    </html>
  );
}
