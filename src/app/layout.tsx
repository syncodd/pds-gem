import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konva Panel Designer",
  description: "Electronic panel design tool using Konva.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

