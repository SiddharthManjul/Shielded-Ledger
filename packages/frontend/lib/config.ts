import { http } from 'viem';
import { sepolia } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Contract addresses - Update these after deployment
export const contractAddresses = {
  zkERC20: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
  CollateralManager: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
  StealthAddressRegistry: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
  PriceOracle: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
  DepositVerifier: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
  TransferVerifier: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
  WithdrawVerifier: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
} as const;

// Wagmi configuration
export const config = getDefaultConfig({
  appName: 'Shielded Ledger',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});
