import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Care & Igeno Platform",
  description: "Integrated Care Management and Learning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased bg-gray-50">
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
