export const blockSweeperRegistryAbi = [
  {
    type: "function",
    name: "getWeeklyStats",
    stateMutability: "view",
    inputs: [
      { name: "player", type: "address", internalType: "address" },
      { name: "weekId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "playerPlays", type: "uint256", internalType: "uint256" },
      { name: "totalPlays", type: "uint256", internalType: "uint256" },
      { name: "lastPlayedTimestamp", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "function",
    name: "lastPlayedAt",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address", internalType: "address" }],
    outputs: [{ name: "timestamp", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "play",
    stateMutability: "nonpayable",
    inputs: [{ name: "weekId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "playerWeekPlays", type: "uint256", internalType: "uint256" },
      { name: "weekPlays", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "function",
    name: "weeklyPlayCount",
    stateMutability: "view",
    inputs: [
      { name: "player", type: "address", internalType: "address" },
      { name: "weekId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "playCount", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "weeklyTotalPlays",
    stateMutability: "view",
    inputs: [{ name: "weekId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "playCount", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "event",
    name: "GamePlayed",
    anonymous: false,
    inputs: [
      { name: "player", type: "address", indexed: true, internalType: "address" },
      { name: "weekId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "weeklyPlayCount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "weeklyTotalPlays", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
] as const;
