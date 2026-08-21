import type { Metadata } from "next";
import "./globals.css";
import BinaryBackground from "@/components/BinaryBackground";
import HackingConsole from "@/components/HackingConsole";

export const metadata: Metadata = {
  title: "Prepwise",
  description: "Interview preparation, simplified.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased crt-overlay relative overflow-x-hidden">
        <BinaryBackground />
        {children}
        <HackingConsole />
      </body>
    </html>
  );
}


