import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HairX Salon SaaS — Partner Platform for Salon Owners",
  description:
    "Grow your salon business with multi-branch management, smart appointment scheduling, staff commission tracking, real-time analytics, and customer CRM.",
  keywords: [
    "Salon SaaS",
    "Salon Management Software",
    "Salon Owner Registration",
    "Hair Salon Booking System",
    "Beauty Parlour Management App",
    "Multi Branch Salon Software",
  ],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-[#1d1d1f] min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
