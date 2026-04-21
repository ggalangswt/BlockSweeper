export const env = {
  appName: import.meta.env.VITE_APP_NAME || "BlockSweeper",
  appDescription:
    import.meta.env.VITE_APP_DESCRIPTION ||
    "MiniPay mini app for onchain minesweeper sessions",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  registryAddressCeloSepolia:
    import.meta.env.VITE_BLOCKSWEEPER_REGISTRY_CELO_SEPOLIA || undefined,
  registryAddressCelo: import.meta.env.VITE_BLOCKSWEEPER_REGISTRY_CELO || undefined,
} as const;
