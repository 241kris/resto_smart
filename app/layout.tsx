"use client"; // <-- nécessaire pour utiliser QueryClientProvider

import { QueryClient } from '@tanstack/react-query';
import { Geist, Geist_Mono, Modak } from "next/font/google";
import "./globals.css";
import Providers from './providers';

const queryClient = new QueryClient();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const modak = Modak({
  weight: "400",
  variable: "--font-modak",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" >
      <body className={`${geistSans.variable} ${geistMono.variable} ${modak.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
