import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
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
        <header className="relative isolate flex h-96 w-full overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/background.png')] bg-cover bg-center" />
          <div className="relative mx-auto flex w-full items-center justify-center max-w-6xl flex-col px-4 pb-5 pt-4 sm:px-8 sm:pb-7 sm:pt-6">
            <div className="flex items-center justify-center w-80 sm:w-100 rounded-xl">
              <Image src="/images/logo.png" alt="Logo OVIN-TRACK" width={300} height={300} className="w-auto h-auto" />
            </div>
            {/* <div className="hidden sm:flex items-center justify-center p-4 opacity-95">
              <Image src="/images/parcours.png" alt="Parcours OVIN-TRACK" width={2840} height={400} className="w-auto h-auto" />
            </div> */}
            <HeaderNav />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
