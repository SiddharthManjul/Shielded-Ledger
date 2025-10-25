import { http } from 'viem';
import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Contract addresses - Deployed contracts
export const contractAddresses = {
  zkERC20: '0xF7116aBaE6C727079107266596dcd488C6069927',
  CollateralManager: '0x2BD08C6447036d0Ed841ED637d25084187cecD08',
  StealthAddressRegistry: '0xE18C3ED2F6E6401fF96deF4dB8e03A9Ae371F971',
  PriceOracle: '0x2E9B614b9ac4F8adEeE8D8A5B11a04787D1E5c51',
  DepositVerifier: '0x80bAdfB970416beF0241cF924e708A6526Dd2e60',
  TransferVerifier: '0xAF6b4F92fc5f4A24C50671B3028E38Ffa93ef01B',
  WithdrawVerifier: '0xEE4A5d5ee49A3F32620C9564CF79f6438033c2B1',
} as const;

// Monad Testnet configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://monad-testnet.drpc.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

// Wagmi configuration
export const config = getDefaultConfig({
  appName: 'Shielded Ledger',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
});
