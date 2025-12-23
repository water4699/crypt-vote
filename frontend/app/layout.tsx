import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "../components/navigation";
import { PageTransition } from "../components/page-transition";
import { ThemeCustomizer } from "../components/theme-customizer";

export const metadata: Metadata = {
  title: "Crypto Vote - FHEVM Encrypted Voting",
  description: "Privacy-preserving encrypted voting system with fully homomorphic encryption",
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <Navigation />
          <PageTransition>
            {children}
          </PageTransition>
          <ThemeCustomizer />
        </Providers>
      </body>
    </html>
  );
}
