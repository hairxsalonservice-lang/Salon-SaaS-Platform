import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "HairX - Partner Salon Management",
  description:
    "The all-in-one salon management platform for HairX partner studios. Bookings, staff, services and revenue.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
