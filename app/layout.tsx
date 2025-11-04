import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from "@/components/query-provider";
import { ConfigProvider } from "@/contexts/config-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: 'CTFd Scoreboard',
  description: 'A modern, client-side CTFd interface.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConfigProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
