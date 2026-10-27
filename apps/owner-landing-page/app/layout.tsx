import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";

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

const themeScript = `(function(){try{var s=localStorage.getItem("hairx_theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;if(s==="dark"||(!s&&d)){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-white dark:bg-[#09090b] text-[#1d1d1f] dark:text-[#f5f5f7] min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
