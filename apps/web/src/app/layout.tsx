import { cn } from "@echotab/ui/util";
import { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { Providers } from "./Providers";

import "./globals.css";

const jetbrains = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "EchoTab Browser Extension",
    description: "EchoTab is a tab management Chrome extension with a simple & clean UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="" suppressHydrationWarning>
            <body className={cn(jetbrains.variable, "font-sans")}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
