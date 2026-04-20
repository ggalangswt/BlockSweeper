export const env = {
  appName: import.meta.env.VITE_APP_NAME || "BlockSweeper",
  appDescription:
    import.meta.env.VITE_APP_DESCRIPTION ||
    "MiniPay mini app for onchain minesweeper sessions",
} as const;
