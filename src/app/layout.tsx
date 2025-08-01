import type { Metadata } from "next";
import "./globals.css";
import "@/styles/reaction-animations.css";
import { IBM_Plex_Mono } from 'next/font/google'
import { PlayerColorProvider } from '@/hooks/usePlayerColors'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-ibm-plex-mono',
})

export const metadata: Metadata = {
  title: "Feedback Song",
  description: "Musical feedback collection app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`bg-gray-50 text-gray-900 ${ibmPlexMono.variable}`}>
        <PlayerColorProvider>
          {children}
        </PlayerColorProvider>
      </body>
    </html>
  );
}