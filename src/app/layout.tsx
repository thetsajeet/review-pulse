import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Review Pulse — thoughtful replies, faster",
    template: "%s · Review Pulse",
  },
  description:
    "Every Google Business review answered with a thoughtful draft you approve before it is sent.",
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
