import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import HeaderNav from "@/components/HeaderNav";
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
        <header className="relative isolate flex h-72 w-full overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/paturage.jpeg')] bg-cover bg-center" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 pb-5 pt-4 sm:px-8 sm:pb-7 sm:pt-6">
            <div className="flex items-start gap-2 sm:gap-4">
              <h1 className="flex-1 text-center text-4xl font-extrabold tracking-[0.2em] text-gray-700 sm:text-5xl rounded-2xl bg-white/80 px-4 py-2">
                OVIN-TRACK
              </h1>
            </div>
            <HeaderNav />
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
