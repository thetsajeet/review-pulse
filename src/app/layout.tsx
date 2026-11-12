import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "Review Pulse — thoughtful replies, faster",
    template: "%s · Review Pulse",
  },
  description:
    "Turn customer reviews into thoughtful, brand-aligned responses with an AI review assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("dark h-full antialiased font-sans", geist.variable)}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
