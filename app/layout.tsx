import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "./nav";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Startup Shell @ UMD",
  description: "Startup Shell prediction market — bet on retention rates",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.className} bg-[var(--background)] text-[var(--foreground)] min-h-screen`}>
        <ThemeProvider>
          <Providers>
            <ToastProvider>
              <Nav />
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
