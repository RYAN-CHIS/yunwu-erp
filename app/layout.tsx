import Sidebar from "@/components/layout/Sidebar";
import SessionProvider from "@/components/auth/SessionProvider";
import { Noto_Serif_SC } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const notoSerif = Noto_Serif_SC({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif-zh",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`h-full ${notoSerif.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full antialiased bg-[#f8f4ef] text-[#2c2c2c]">
        <SessionProvider>
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
          <main className="lg:pl-64 min-h-screen">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
