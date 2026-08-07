import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Care & Igeno Platform",
  description: "Integrated Care Management and Learning Platform",
  icons: { icon: "/favlogo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className="antialiased bg-gray-50">
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
