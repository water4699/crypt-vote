"use client";

import type { ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { InMemoryStorageProvider } from "../hooks/useInMemoryStorage";
import { MetaMaskProvider } from "../hooks/metamask/useMetaMaskProvider";
import { MetaMaskEthersSignerProvider } from "../hooks/metamask/useMetaMaskEthersSigner";
import { ThemeProvider } from "../components/theme-provider";

// Local Hardhat network
const localhost = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
} as const;

// Sepolia testnet
const sepolia = {
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.org'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
} as const;

// Use RainbowKit config with Sepolia support
const config = getDefaultConfig({
  appName: "Crypto Vote",
  projectId: "ef3325a718834a2b1b4134d3f520933d", // WalletConnect Project ID
  chains: [localhost, sepolia],
  ssr: true,
  appDescription: "Privacy-preserving encrypted voting system with FHEVM",
  appUrl: "http://localhost:3000",
  appIcon: "http://localhost:3000/crypto-vote-logo.svg",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <ThemeProvider>
      <MetaMaskProvider>
        <MetaMaskEthersSignerProvider initialMockChains={{
          31337: "http://localhost:8545", // Enable mock for local development
        }}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
        </MetaMaskEthersSignerProvider>
      </MetaMaskProvider>
    </ThemeProvider>
  );
}
