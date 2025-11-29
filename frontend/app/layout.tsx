import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";
import { EnglishConnectButton } from "../components/EnglishConnectButton";

export const metadata: Metadata = {
  title: "Encrypted Voting System",
  description: "Privacy-preserving voting platform with FHEVM",
  icons: {
    icon: "/crypto-vote-logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`text-foreground antialiased`}>
        <main className="flex flex-col min-h-screen">
          <Providers>
            <nav className="w-full px-4 md:px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm relative z-50">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Image
                    src="/crypto-vote-logo.svg"
                    alt="Crypto Vote Logo"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                  <div>
                    <h1 className="text-lg font-bold text-gray-800">Crypto Vote</h1>
                    <p className="text-xs text-gray-500">FHEVM Encrypted</p>
                  </div>
                </div>
                <EnglishConnectButton />
              </div>
            </nav>
            <div className="flex-1 w-full">
              {children}
            </div>
          </Providers>
        </main>
      </body>
    </html>
  );
}
