# Shielded Ledger Frontend Setup Guide

## Prerequisites

- Node.js 20+ or Bun runtime
- MetaMask or another Web3 wallet
- WalletConnect Project ID

## Installation

1. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Get a WalletConnect Project ID:**
   - Go to https://cloud.walletconnect.com
   - Create a new project
   - Copy the Project ID
   - Update `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env.local`

4. **Update contract addresses:**
   - After deploying contracts, update the addresses in:
     - `.env.local` (for runtime)
     - `lib/config.ts` (for TypeScript)

## Running the Development Server

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
frontend/
├── app/                      # Next.js app router pages
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Landing page
│   ├── mint/                # Token minting page
│   │   └── page.tsx
│   └── launch/              # Token launch page
│       └── page.tsx
├── components/              # Reusable UI components
│   ├── NavHeader.tsx
│   ├── TransactionStatus.tsx
│   ├── TokenInput.tsx
│   └── LoadingSpinner.tsx
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useZkERC20.ts
│   └── useCollateralManager.ts
├── lib/                     # Core libraries
│   ├── abi/                 # Contract ABIs
│   ├── contracts.ts         # ABI exports
│   ├── config.ts            # Wagmi & contract config
│   └── providers.tsx        # App providers
└── types/                   # TypeScript types
    └── contracts.ts
```

## Features

### 1. Landing Page (/)
- Connect wallet with RainbowKit
- Sign authentication message
- Auto-redirect to mint page after auth

### 2. Token Minting (/mint)
- Select ERC20 collateral token
- Input amount to mint
- Approve collateral spending
- Mint confidential tokens 1:1

### 3. Token Launch (/launch)
- Create new confidential token
- Configure name, symbol, supply
- Optional collateral backing
- Deploy zkERC20 instance

## Contract Integration

### Required Contract Deployments

Before using the frontend, deploy these contracts:

1. **Core Contracts:**
   - zkERC20 (main shielded token)
   - CollateralManager
   - StealthAddressRegistry
   - PriceOracle

2. **Verifier Contracts:**
   - DepositVerifier
   - TransferVerifier
   - WithdrawVerifier

3. **Update Addresses:**
   Update contract addresses in `lib/config.ts`:
   ```typescript
   export const contractAddresses = {
     zkERC20: '0x...',
     CollateralManager: '0x...',
     // ... etc
   };
   ```

## ZK Proof Integration (TODO)

Currently, the frontend has placeholder ZK proof generation. To integrate real proofs:

1. **Install SnarkJS:**
   ```bash
   bun add snarkjs
   ```

2. **Add circuit artifacts:**
   - Copy `.zkey` files to `public/circuits/`
   - Copy `verification_key.json` files

3. **Implement proof generation:**
   - Create `lib/proofGenerator.ts`
   - Import SnarkJS
   - Generate proofs client-side or via API

4. **Update transaction calls:**
   - Replace placeholder proofs in `useZkERC20.ts`
   - Add proper proof generation before contract calls

## Building for Production

```bash
bun run build
# or
npm run build
```

## Deployment

The app can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Any static hosting with Node.js support

## Troubleshooting

### Wallet Connection Issues
- Ensure you have a WalletConnect Project ID
- Check that your wallet is connected to the correct network (Sepolia)

### Transaction Failures
- Verify contract addresses are correct
- Ensure contracts are deployed on the current network
- Check that you have sufficient ETH for gas

### RainbowKit Styling Issues
- Ensure `@rainbow-me/rainbowkit/styles.css` is imported
- Check Tailwind CSS configuration

## Next Steps

1. Deploy contracts to testnet
2. Update contract addresses in config
3. Test wallet connection and authentication
4. Implement ZK proof generation
5. Test minting and launching flows
6. Add comprehensive error handling
7. Implement transaction history
8. Add balance displays for shielded tokens

## Support

For issues or questions, please refer to:
- [RainbowKit Docs](https://rainbowkit.com)
- [Wagmi Docs](https://wagmi.sh)
- [Next.js Docs](https://nextjs.org/docs)
