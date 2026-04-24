import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Vultur: Candidate Matcher",
    description: "Candidate Matcher",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${inter.className} antialiased bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100`}
            >
                <header className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-3 bg-white dark:bg-neutral-900 flex items-center justify-between">
                    <img
                        src="/logos/vultur-primary-black.svg"
                        alt="Vultur"
                        className="h-7 w-auto dark:hidden"
                    />
                    <img
                        src="/logos/vultur-primary-white.svg"
                        alt="Vultur"
                        className="h-7 w-auto hidden dark:block"
                    />
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-neutral-400 dark:text-neutral-500">
                            Candidate Matcher
                        </div>
                        <ThemeToggle />
                    </div>
                </header>
                {children}
            </body>
        </html>
    );
}
