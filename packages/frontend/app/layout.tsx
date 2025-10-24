import type { Metadata } from "next";
import { JetBrains_Mono, Bruno_Ace_SC, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

// Using Manrope as it has a similar calm, modern feel to Vend Sans
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const brunoAceSC = Bruno_Ace_SC({
  variable: "--font-bruno-ace-sc",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shielded Ledger - Confidential Token Launchpad",
  description: "Launch and mint confidential ERC20 tokens with zero-knowledge proofs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${jetbrainsMono.variable} ${brunoAceSC.variable} antialiased font-sans dark`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
