import "@echotab/ui/globals.css";

import Toaster from "@echotab/ui/Toast";
import { cn } from "@echotab/ui/util";
import { Metadata } from "next";
import { Inter, JetBrains_Mono, Sahitya } from "next/font/google";

import { Providers } from "./Providers";

import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const sahitya = Sahitya({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "EchoTab Browser Extension",
  description: "EchoTab | Clean & simple tab management browser extension",
  metadataBase:
    process.env.NODE_ENV === "production" ? new URL(process.env.NEXT_PUBLIC_WEB_HOST!) : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          jetbrains.variable,
          sahitya.variable,
          "echotab-root font-sans",
        )}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
