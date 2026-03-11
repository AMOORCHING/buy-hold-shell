import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "./nav";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shell Markets",
  description: "Startup Shell prediction market — bet on retention rates",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen`}>
        <Providers>
          <ToastProvider>
            <Nav />
            <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
