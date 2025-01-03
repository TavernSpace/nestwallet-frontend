import { WalletIcon } from '@wallet-standard/base';

export const nestWalletIcon: WalletIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMxMDExMDIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNi42NDI0IDE2Ljc1ODRDMTYuNjQyNCAxMy44ODQ1IDE0LjcyMjQgMTIuMDg2MSAxMi45NTc3IDEyLjA4NjFDMTEuMTkzMSAxMi4wODYxIDkuMjczMSAxMy44ODQ1IDkuMjczMSAxNi43NTg0QzkuMjczMSAxOS42MzI0IDExLjE5MzEgMjEuNDMwNyAxMi45NTc3IDIxLjQzMDdMMTIuOTU3NyAyNS4wNzc0QzguNjM4NDIgMjUuMDc3NCA1LjYyNjQzIDIxLjA1OTMgNS42MjY0MyAxNi43NTg0QzUuNjI2NDMgMTIuNDU3NSA4LjYzODQyIDguNDM5NDUgMTIuOTU3NyA4LjQzOTQ1QzE3LjI3NzEgOC40Mzk0NSAyMC4yODkxIDEyLjQ1NzUgMjAuMjg5MSAxNi43NTg0TDE2LjY0MjQgMTYuNzU4NFoiIGZpbGw9IiNFRUY0NTUiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNS4zNDk4IDE1LjIzOTZDMTUuMzQ5OCAxOC4xMTM2IDE3LjI2OTggMTkuOTExOSAxOS4wMzQ0IDE5LjkxMTlDMjAuNzk5MSAxOS45MTE5IDIyLjcxOTEgMTguMTEzNiAyMi43MTkxIDE1LjIzOTZDMjIuNzE5MSAxMi4zNjU3IDIwLjc5OTEgMTAuNTY3MyAxOS4wMzQ0IDEwLjU2NzNMMTkuMDM0NCA2LjkyMDY4QzIzLjM1MzggNi45MjA2OCAyNi4zNjU4IDEwLjkzODcgMjYuMzY1OCAxNS4yMzk2QzI2LjM2NTggMTkuNTQwNiAyMy4zNTM4IDIzLjU1ODYgMTkuMDM0NCAyMy41NTg2QzE0LjcxNTEgMjMuNTU4NiAxMS43MDMxIDE5LjU0MDYgMTEuNzAzMSAxNS4yMzk2TDE1LjM0OTggMTUuMjM5NloiIGZpbGw9IiNFRUY0NTUiLz4KPC9zdmc+Cg==' as const;

/** Solana Mainnet (beta) cluster, e.g. https://api.mainnet-beta.solana.com */
export const SOLANA_MAINNET_CHAIN = 'solana:mainnet';

/** Array of all Solana clusters */
export const SOLANA_CHAINS = [SOLANA_MAINNET_CHAIN] as const;
