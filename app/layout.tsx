import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Knowledge Agent",
  description: "Chat with your local notes folder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-[#e6e8eb] antialiased">{children}</body>
    </html>
  );
}
