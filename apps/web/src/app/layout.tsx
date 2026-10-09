import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DNSOil — Domains, one dashboard",
  description: "Find, manage and renew domains through one simple workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
