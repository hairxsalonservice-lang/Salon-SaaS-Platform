import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import LayoutWrapper from "@/components/LayoutWrapper";

// Open the DNS/TLS connection to the API as early as possible. The salon
// panel and the API are separate origins, so the first authenticated request
// otherwise pays connection setup before it can even send a preflight.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969/api/v1";

function getApiOrigin(): string | null {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return null;
  }
}

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
  const apiOrigin = getApiOrigin();

  // Resolve the saved theme before first paint. Without this, the server-rendered
  // light shell flashes briefly before the ThemeProvider hydrates.
  const themeScript = `
(function () {
  try {
    var key = "salon-panel-theme";
    var saved = localStorage.getItem(key);
    var theme = (saved === "light" || saved === "dark")
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {apiOrigin && (
          <>
            <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={apiOrigin} />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
