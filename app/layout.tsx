import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Personal Knowledge Agent",
  description: "Chat with your local notes folder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased"><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
