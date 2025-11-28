import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";
import { EnglishConnectButton } from "../components/EnglishConnectButton";

export const metadata: Metadata = {
  title: "Encrypted Voting System",
  description: "Privacy-preserving voting platform with FHEVM",
  icons: {
    icon: "/study-tracker-logo.svg", // TODO: Update to voting logo
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`zama-bg text-foreground antialiased`}>
        <div className="fixed inset-0 w-full h-full zama-bg z-[-20]"></div>
        <main className="flex flex-col min-h-screen">
          <Providers>
            <nav className="w-full px-4 md:px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Image
                    src="/study-tracker-logo.svg"
                    alt="Voting System Logo"
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
            <div className="flex-1 py-8">
              {children}
            </div>
          </Providers>
        </main>
      </body>
    </html>
  );
}
