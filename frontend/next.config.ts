import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers() {
    // Required by FHEVM and Base Account SDK
    return Promise.resolve([
      {
        source: '/',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]);
  },
  // Disable telemetry and other external requests
  experimental: {
    // This helps reduce external API calls
  },
  // Configure webpack for production builds
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ignore React Native modules that MetaMask SDK tries to import
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };
    
    // Ignore warnings about missing modules
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@metamask\/sdk/,
        message: /Can't resolve '@react-native-async-storage\/async-storage'/,
      },
    ];
    
    return config;
  },
};

export default nextConfig;
