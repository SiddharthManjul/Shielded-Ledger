# Shielded Ledger Smart Contracts

A complete privacy-preserving payment solution built on Hedera with zero-knowledge proofs and Pyth Network price feeds.

## Overview

The Shielded Ledger is a comprehensive smart contract system that enables:

- **Private Transactions**: Zero-knowledge proof-based transfers using Groth16 verification
- **Multi-Asset Support**: Support for PYUSD, BTC, ETH, and HBAR with zkERC20 wrappers
- **Real-time Pricing**: Integration with Pyth Network oracle for accurate price feeds
- **Stealth Addresses**: Privacy-enhanced recipient addresses
- **Collateral Management**: Secure backing of private tokens with underlying assets

## Architecture

### Core Contracts

1. **zkERC20** (`src/core/zkERC20.sol`)
   - Privacy-preserving token with ZK proof verification
   - Supports deposits, transfers, and withdrawals with full anonymity
   - Uses Merkle tree for commitment management

2. **CollateralManager** (`src/core/CollateralManager.sol`)
   - Manages ERC20 collateral backing for zkERC20 tokens
   - Handles locking/releasing of underlying assets
   - Integrates with PriceOracle for valuation

3. **PriceOracle** (`src/core/PriceOracle.sol`)
   - Integrates with Pyth Network for real-time price feeds
   - Supports PYUSD/USD, BTC/USD, ETH/USD, and HBAR/USD pairs
   - Pull-based price update model

4. **StealthAddressRegistry** (`src/core/StealthAddressRegistry.sol`)
   - Manages stealth meta-addresses for enhanced privacy
   - Supports announcement and discovery of stealth payments

### Verifier Contracts

- **DepositVerifier** (`src/verifiers/DepositVerifier.sol`) - Verifies deposit proofs
- **TransferVerifier** (`src/verifiers/TransferVerifier.sol`) - Verifies transfer proofs
- **WithdrawVerifier** (`src/verifiers/WithdrawVerifier.sol`) - Verifies withdrawal proofs

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js >= 18
- Hedera testnet account with HBAR

### 1. Setup

```bash
cd packages/contracts

# Install Foundry if needed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Copy and configure environment
cp .env.example .env
```

Edit `.env` and configure:
- `PRIVATE_KEY`: Your deployment private key
- `PYTH_CONTRACT_ADDRESS`: Pyth Network contract on Hedera testnet

### 2. Get Pyth Contract Address

The Pyth Network contract address is required for deployment. Find it at:

1. Check the official Pyth tutorial for Hedera:
   ```bash
   git clone https://github.com/hedera-dev/tutorial-js-pyth-oracle-contract-pull
   # Check the contract files for the Pyth address
   ```

2. Visit Pyth documentation:
   - https://docs.pyth.network/price-feeds/contract-addresses
   - Look for Hedera Testnet in the EVM networks section

3. Contact support:
   - Pyth Discord: https://discord.gg/invite/PythNetwork
   - Hedera Discord: https://hedera.com/discord

### 3. Build

```bash
forge build
```

### 4. Deploy

```bash
# Deploy everything (verifiers, oracle, collateral manager, mock tokens, zk tokens)
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy

# Or use individual deployment scripts
forge script script/DeployPriceOracle.s.sol:DeployPriceOracle \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy
```

Deployment outputs are saved to `deployments/hedera-testnet-latest.json`

## Deployment Scripts

### DeployAll.s.sol - Complete System Deployment

Deploys the entire Shielded Ledger system in the correct order:

1. ZK Verifiers (Deposit, Transfer, Withdraw)
2. PriceOracle with Pyth integration
3. CollateralManager
4. StealthAddressRegistry
5. Mock tokens (optional, for testing)
6. zkERC20 tokens for each asset
7. Price feed registration

**Configuration via .env:**

```bash
DEPLOY_MOCK_TOKENS=1           # 1 = deploy test tokens, 0 = use existing
REGISTER_PRICE_FEEDS=1         # 1 = auto-register feeds, 0 = manual
DEPLOY_ZK_TOKENS=1             # 1 = deploy zkERC20s, 0 = skip
ZK_TOKEN_DENOMINATION=1e18     # Fixed denomination for zkERC20
```

**Usage:**

```bash
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy \
  -vvvv
```

### Individual Deployment Scripts

#### DeployPriceOracle.s.sol
Deploy only the PriceOracle contract

```bash
forge script script/DeployPriceOracle.s.sol:DeployPriceOracle \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy
```

#### RegisterPriceFeeds.s.sol
Register Pyth price feeds for tokens

```bash
# Set PRICE_ORACLE_ADDRESS in .env first
forge script script/RegisterPriceFeeds.s.sol:RegisterPriceFeeds \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy
```

#### DeployMockTokens.s.sol
Deploy test tokens (testnet only)

```bash
forge script script/DeployMockTokens.s.sol:DeployMockTokens \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy
```

## Pyth Network Integration

### Supported Price Feeds

| Asset | Pair | Price Feed ID |
|-------|------|---------------|
| PYUSD | USD | `0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692` |
| BTC | USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| ETH | USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |
| HBAR | USD | `0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd` |

### Using Price Feeds

The PriceOracle contract provides several methods to access prices:

```solidity
// Get raw price data
IPriceOracle.Price memory price = priceOracle.getPrice(tokenAddress);

// Get USD price with custom decimals
uint256 priceUsd = priceOracle.getPriceInUsd(tokenAddress, 18);

// Update prices (pull model)
bytes[] memory updateData = ... // from Pyth Hermes API
uint256 fee = priceOracle.getUpdateFee(updateData);
priceOracle.updatePriceFeeds{value: fee}(updateData);
```

### Frontend Integration

```typescript
import { PriceServiceConnection } from '@pythnetwork/price-service-client';

const connection = new PriceServiceConnection('https://hermes.pyth.network');
const priceIds = [
  '0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692', // PYUSD
  '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // BTC
  '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH
  '0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd', // HBAR
];

const priceUpdateData = await connection.getPriceFeedsUpdateData(priceIds);
```

## Testing

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvvv

# Test specific contract
forge test --match-contract PriceOracle

# Gas report
forge test --gas-report

# Coverage
forge coverage

# Format code
forge fmt
```

## Contract Addresses

After deployment, contract addresses are saved to `deployments/hedera-testnet-latest.json`:

```json
{
  "network": "hedera-testnet",
  "verifiers": {
    "deposit": "0x...",
    "transfer": "0x...",
    "withdraw": "0x..."
  },
  "core": {
    "priceOracle": "0x...",
    "collateralManager": "0x...",
    "stealthAddressRegistry": "0x..."
  },
  "underlyingTokens": {
    "pyusd": "0x...",
    "btc": "0x...",
    "eth": "0x...",
    "hbar": "0x..."
  },
  "zkTokens": {
    "zkPYUSD": "0x...",
    "zkBTC": "0x...",
    "zkETH": "0x...",
    "zkHBAR": "0x..."
  }
}
```

## System Flow

### Deposit Flow

1. User approves underlying token (e.g., PYUSD) to zkERC20 contract
2. User generates ZK proof for deposit with commitment
3. zkERC20 contract verifies proof
4. Underlying tokens transferred to CollateralManager
5. Commitment added to Merkle tree
6. User receives private note (off-chain)

### Transfer Flow

1. User generates ZK proof with input/output commitments
2. zkERC20 verifies proof and checks Merkle root
3. Input nullifiers are marked as spent
4. Output commitments added to tree
5. Recipients receive encrypted notes (off-chain)

### Withdrawal Flow

1. User generates ZK proof for withdrawal
2. zkERC20 verifies proof
3. CollateralManager releases underlying tokens to recipient
4. Nullifier marked as spent

## Security Considerations

1. **ZK Proofs**: All operations require valid Groth16 proofs
2. **Merkle Tree**: Commitments tracked in incremental Merkle tree
3. **Nullifiers**: Double-spend prevention via nullifier tracking
4. **Price Oracle**: 60-second maximum price age (configurable)
5. **Reentrancy**: All external calls protected with ReentrancyGuard
6. **Access Control**: Owner-based administration for sensitive operations

## Gas Estimates

| Operation | Gas Cost (approx) |
|-----------|------------------|
| Deploy Verifier | 1.5M |
| Deploy PriceOracle | 1.2M |
| Deploy CollateralManager | 1.5M |
| Deploy zkERC20 | 3.0M |
| Deposit | 400k |
| Transfer | 500k |
| Withdraw | 350k |
| Update Prices | 150k-250k |

## Troubleshooting

### "PYTH_CONTRACT_ADDRESS not set"

Make sure you've configured the Pyth contract address in `.env`. Get it from:
- https://docs.pyth.network/price-feeds/contract-addresses
- https://github.com/hedera-dev/tutorial-js-pyth-oracle-contract-pull

### "PriceFeedNotRegistered"

Run the price feed registration:
```bash
forge script script/RegisterPriceFeeds.s.sol:RegisterPriceFeeds \
  --rpc-url $RPC_URL \
  --broadcast
```

### "InvalidProof"

Ensure your ZK circuits are compiled and proofs are generated correctly. Check the circuits package.

### Low HBAR Balance

Ensure your deployment account has sufficient HBAR for gas fees. Get testnet HBAR from:
- https://portal.hedera.com

## Additional Resources

- [Pyth Network Documentation](https://docs.pyth.network/)
- [Hedera Documentation](https://docs.hedera.com/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Complete Integration Guide](./PYTH_INTEGRATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

## License

MIT
