import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
