# Shielded Ledger Indexer

This package provides a blockchain indexer using Envio HyperSync to efficiently query and index all Shielded Ledger transactions for a specific wallet address.

## Features

- **Fast Indexing**: Uses Envio HyperSync for efficient blockchain data retrieval
- **User-Specific**: Indexes only transactions related to a specific user address
- **Comprehensive Tracking**: Tracks deposits, transfers, withdrawals, and note states
- **Event Monitoring**: Monitors all relevant smart contract events:
  - `NoteCommitted` - When new confidential notes are created
  - `NullifierSpent` - When notes are spent
  - `Deposit` - When users deposit collateral
  - `CollateralLocked` - Tracks locked collateral amounts
  - `CollateralReleased` - When users withdraw
  - `Withdrawal` - Withdrawal events

## Installation

```bash
cd packages/indexer
npm install
```

## Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:

```env
# Contract addresses from your deployment
ZK_ERC20_ADDRESS=0xYourZkERC20Address
COLLATERAL_MANAGER_ADDRESS=0xYourCollateralManagerAddress

# User address to index
USER_ADDRESS=0xYourWalletAddress

# Starting block number (optional, defaults to 0)
FROM_BLOCK=0

# HyperSync URL (Base Sepolia by default)
HYPERSYNC_URL=https://base-sepolia.hypersync.xyz
```

### Finding Your Contract Addresses

You can find your deployed contract addresses in:
- `packages/frontend/lib/config.ts`
- Or from your deployment logs
- Or from the blockchain explorer

### HyperSync Endpoints

Available HyperSync endpoints for different networks:

- **Base Sepolia**: `https://base-sepolia.hypersync.xyz`
- **Base Mainnet**: `https://base.hypersync.xyz`
- **Ethereum Mainnet**: `https://eth.hypersync.xyz`
- **Polygon**: `https://polygon.hypersync.xyz`
- **Arbitrum**: `https://arbitrum.hypersync.xyz`
- **Optimism**: `https://optimism.hypersync.xyz`

See [Envio HyperSync Docs](https://docs.envio.dev/docs/HyperSync/overview) for more endpoints.

## Usage

### Running the Indexer

Index transactions for a specific user:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### Output

The indexer will:
1. Query the blockchain for all relevant events
2. Filter events to only those involving the specified user address
3. Process and organize the data into a structured format
4. Save the results to `indexed-data.json`
5. Print a summary to console

Example output:
```
Indexing transactions for user: 0x1234... from block 0
Indexing NoteCommitted events...
Found 5 NoteCommitted events
User has 5 notes
Indexing NullifierSpent events...
Found 2 NullifierSpent events
Indexing CollateralLocked events...
Found 5 CollateralLocked events
Indexing CollateralReleased events...
Found 1 CollateralReleased events

=== User Transaction Summary ===
Total deposits: 5
Total transfers: 0
Total withdrawals: 1
Total notes: 5
Unspent notes: 4

Indexing complete!
```

### Programmatic Usage

You can also use the indexer as a library:

```typescript
import { ShieldedLedgerIndexer } from './index';

const indexer = new ShieldedLedgerIndexer(
  'https://base-sepolia.hypersync.xyz',
  84532 // Base Sepolia chain ID
);

// Index user transactions
const userData = await indexer.indexUserTransactions(
  '0xUserAddress',
  0 // from block
);

console.log('User notes:', userData.notes);
console.log('User deposits:', userData.deposits);

// Save to file
indexer.saveToFile('./output.json');
```

## Data Structure

The indexer returns data in the following structure:

```typescript
interface UserNotes {
  [address: string]: {
    deposits: IndexedTransaction[];
    transfers: IndexedTransaction[];
    withdrawals: IndexedTransaction[];
    notes: {
      commitment: string;
      index: number;
      amount?: string;
      spent: boolean;
      encryptedNote: string;
    }[];
  };
}

interface IndexedTransaction {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  eventType: string;
  eventData: any;
}
```

## Integration with Frontend

The frontend includes an API endpoint (`/api/indexer/route.ts`) that provides indexed data to the dashboard. This endpoint:

1. Fetches events from the blockchain using viem
2. Filters events for the specific user
3. Returns structured data for display

The dashboard automatically fetches data from this endpoint and falls back to localStorage if unavailable.

## Performance

HyperSync is significantly faster than traditional RPC methods:

- **Traditional RPC**: Minutes to hours for historical data
- **HyperSync**: Seconds for the same data

This makes it ideal for:
- Real-time dashboards
- Historical transaction analysis
- Bulk data exports
- Analytics and reporting

## Troubleshooting

### No events found

- Check that your contract addresses are correct
- Verify that transactions have occurred on the blockchain
- Ensure the `FROM_BLOCK` is set to before your first transaction
- Check that you're using the correct HyperSync endpoint for your network

### Connection errors

- Verify your internet connection
- Check that the HyperSync endpoint is correct and accessible
- Some networks may have rate limits

### Missing amounts

- Amounts come from `CollateralLocked` events
- Ensure your CollateralManager contract is properly emitting events
- Check that the zkToken is registered with CollateralManager

## Development

### Building

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Testing

To test the indexer with your own address:

```bash
USER_ADDRESS=0xYourAddress npm start
```

## Advanced Features

### Custom Query Ranges

Index specific block ranges:

```typescript
const userData = await indexer.indexUserTransactions(
  userAddress,
  1000000, // from block
  2000000  // to block (optional)
);
```

### Incremental Updates

Load previous data and update:

```typescript
indexer.loadFromFile('./indexed-data.json');
const latestBlock = 1000000; // Get from saved data
await indexer.indexUserTransactions(userAddress, latestBlock);
indexer.saveToFile('./indexed-data.json');
```

### Multiple Users

Index multiple users:

```typescript
const users = ['0xUser1', '0xUser2', '0xUser3'];

for (const user of users) {
  await indexer.indexUserTransactions(user, 0);
}

indexer.saveToFile('./all-users.json');
```

## Resources

- [Envio HyperSync Documentation](https://docs.envio.dev/docs/HyperSync/overview)
- [HyperSync Tutorial](https://docs.envio.dev/docs/HyperSync/tutorial-address-transactions)
- [Shielded Ledger Documentation](../../README.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Envio HyperSync documentation
3. Open an issue in the project repository
