import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthFloatingPanel from "@/components/AuthFloatingPanel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OVIN-TRACK",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)
{
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex w-full items-center justify-center mt-5 bg-zinc-50 font-sans dark:bg-zinc-950/90">
          <h1 className="text-4xl font-bold w-full text-center">OVIN-TRACK</h1>
        </div>
        <AuthFloatingPanel />
        {children}
      </body>
    </html>
  );
}
