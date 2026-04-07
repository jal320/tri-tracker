import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brickhaus",
  description: "Your triathlon training hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh' }}>{children}</body>
    </html>
  );
}
