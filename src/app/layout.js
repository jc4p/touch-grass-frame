import { Geist, Geist_Mono } from "next/font/google";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import { FrameInit } from "@/components/FrameInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: "--font-bebas-neue",
  subsets: ["latin"],
});

export const metadata = {
  title: "Touch Grass",
  description: "Create and share your Touch Grass moment",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable}`}>
        {children}
        <FrameInit />
      </body>
    </html>
  );
}
