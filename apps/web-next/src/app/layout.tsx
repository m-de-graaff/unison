import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { ThemeProvider, ThemeScript } from "@unison-ui/ui";
import { THEMES } from "demo-content";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unison demo",
  description: "Unison demo (Next.js)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets data-theme and data-unison-theme before paint: no flash of the wrong theme. */}
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider themes={THEMES}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
