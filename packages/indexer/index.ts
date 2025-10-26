import { HypersyncClient, Query, LogSelection, FieldSelection } from "@envio-dev/hypersync-client";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

// Contract addresses - update these with your actual deployed addresses
const CONTRACTS = {
  zkERC20: process.env.ZK_ERC20_ADDRESS || "0x0000000000000000000000000000000000000000",
  CollateralManager: process.env.COLLATERAL_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000",
};

// Event signatures
const EVENT_SIGNATURES = {
  // zkERC20 events
  NoteCommitted: "NoteCommitted(bytes32,uint256,bytes)",
  NullifierSpent: "NullifierSpent(bytes32)",
  Deposit: "Deposit(bytes32)",
  Withdrawal: "Withdrawal(bytes32)",

  // CollateralManager events
  CollateralLocked: "CollateralLocked(address,address,uint256,bytes32)",
  CollateralReleased: "CollateralReleased(address,address,address,uint256,bytes32)",
};

interface IndexedTransaction {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  eventType: string;
  eventData: any;
}

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

class ShieldedLedgerIndexer {
  private client: HypersyncClient;
  private userNotes: UserNotes = {};
  private chainId: number;

  constructor(hypersyncUrl: string, chainId: number = 1) {
    this.client = HypersyncClient.new({
      url: hypersyncUrl,
    });
    this.chainId = chainId;
  }

  /**
   * Index all transactions for a specific user address
   */
  async indexUserTransactions(userAddress: string, fromBlock: number = 0): Promise<UserNotes[string]> {
    console.log(`Indexing transactions for user: ${userAddress} from block ${fromBlock}`);

    if (!this.userNotes[userAddress]) {
      this.userNotes[userAddress] = {
        deposits: [],
        transfers: [],
        withdrawals: [],
        notes: [],
      };
    }

    // Query for NoteCommitted events (deposits and transfers)
    await this.indexNoteCommittedEvents(userAddress, fromBlock);

    // Query for NullifierSpent events
    await this.indexNullifierSpentEvents(userAddress, fromBlock);

    // Query for CollateralLocked events (to track deposit amounts)
    await this.indexCollateralLockedEvents(userAddress, fromBlock);

    // Query for CollateralReleased events (withdrawals)
    await this.indexCollateralReleasedEvents(userAddress, fromBlock);

    return this.userNotes[userAddress];
  }

  /**
   * Index NoteCommitted events to track user's notes
   */
  private async indexNoteCommittedEvents(userAddress: string, fromBlock: number) {
    console.log("Indexing NoteCommitted events...");

    const query: Query = {
      fromBlock: fromBlock,
      logs: [
        {
          address: [CONTRACTS.zkERC20],
          topics: [
            [ethers.id(EVENT_SIGNATURES.NoteCommitted)],
          ],
        },
      ],
      fieldSelection: {
        log: [
          "block_number",
          "log_index",
          "transaction_hash",
          "transaction_index",
          "data",
          "address",
          "topic0",
          "topic1",
          "topic2",
          "topic3",
        ],
        block: ["number", "timestamp", "hash"],
        transaction: ["from", "to", "hash", "input"],
      },
    };

    try {
      const res = await this.client.sendReq(query);

      if (!res.data) {
        console.log("No NoteCommitted events found");
        return;
      }

      console.log(`Found ${res.data.logs.length} NoteCommitted events`);

      // Process events
      for (let i = 0; i < res.data.logs.length; i++) {
        const log = res.data.logs[i];
        const block = res.data.blocks.find((b: any) => b.number === log.block_number);
        const tx = res.data.transactions.find((t: any) => t.hash === log.transaction_hash);

        if (!tx || !block) continue;

        // Check if transaction is from the user
        if (tx.from.toLowerCase() !== userAddress.toLowerCase()) continue;

        // Decode event data
        const iface = new ethers.Interface([
          "event NoteCommitted(bytes32 indexed commitment, uint256 index, bytes encryptedNote)"
        ]);

        const decoded = iface.parseLog({
          topics: [log.topic0, log.topic1, log.topic2, log.topic3].filter(Boolean) as string[],
          data: log.data,
        });

        if (!decoded) continue;

        const commitment = decoded.args[0];
        const index = Number(decoded.args[1]);
        const encryptedNote = decoded.args[2];

        // Add to user's notes
        this.userNotes[userAddress].notes.push({
          commitment,
          index,
          spent: false,
          encryptedNote,
        });

        // Add to deposits list
        this.userNotes[userAddress].deposits.push({
          txHash: tx.hash,
          blockNumber: Number(log.block_number),
          timestamp: Number(block.timestamp),
          from: tx.from,
          to: tx.to,
          eventType: "NoteCommitted",
          eventData: {
            commitment,
            index,
            encryptedNote,
          },
        });
      }

      console.log(`User has ${this.userNotes[userAddress].notes.length} notes`);
    } catch (error) {
      console.error("Error indexing NoteCommitted events:", error);
    }
  }

  /**
   * Index NullifierSpent events to mark notes as spent
   */
  private async indexNullifierSpentEvents(userAddress: string, fromBlock: number) {
    console.log("Indexing NullifierSpent events...");

    const query: Query = {
      fromBlock: fromBlock,
      logs: [
        {
          address: [CONTRACTS.zkERC20],
          topics: [
            [ethers.id(EVENT_SIGNATURES.NullifierSpent)],
          ],
        },
      ],
      fieldSelection: {
        log: [
          "block_number",
          "log_index",
          "transaction_hash",
          "data",
          "topic0",
          "topic1",
        ],
        block: ["number", "timestamp"],
        transaction: ["from", "to", "hash"],
      },
    };

    try {
      const res = await this.client.sendReq(query);

      if (!res.data) {
        console.log("No NullifierSpent events found");
        return;
      }

      console.log(`Found ${res.data.logs.length} NullifierSpent events`);

      // Process events
      for (let i = 0; i < res.data.logs.length; i++) {
        const log = res.data.logs[i];
        const tx = res.data.transactions.find((t: any) => t.hash === log.transaction_hash);

        if (!tx) continue;

        // Check if transaction is from the user
        if (tx.from.toLowerCase() !== userAddress.toLowerCase()) continue;

        const iface = new ethers.Interface([
          "event NullifierSpent(bytes32 indexed nullifier)"
        ]);

        const decoded = iface.parseLog({
          topics: [log.topic0, log.topic1].filter(Boolean) as string[],
          data: log.data,
        });

        if (!decoded) continue;

        const nullifier = decoded.args[0];

        // Mark corresponding note as spent (if we can match it)
        // Note: In a full implementation, you'd need to track nullifier->commitment mapping
        console.log(`Nullifier spent: ${nullifier}`);
      }
    } catch (error) {
      console.error("Error indexing NullifierSpent events:", error);
    }
  }

  /**
   * Index CollateralLocked events to track deposit amounts
   */
  private async indexCollateralLockedEvents(userAddress: string, fromBlock: number) {
    console.log("Indexing CollateralLocked events...");

    const query: Query = {
      fromBlock: fromBlock,
      logs: [
        {
          address: [CONTRACTS.CollateralManager],
          topics: [
            [ethers.id(EVENT_SIGNATURES.CollateralLocked)],
          ],
        },
      ],
      fieldSelection: {
        log: [
          "block_number",
          "transaction_hash",
          "data",
          "topic0",
          "topic1",
          "topic2",
          "topic3",
        ],
        block: ["number", "timestamp"],
        transaction: ["from", "hash"],
      },
    };

    try {
      const res = await this.client.sendReq(query);

      if (!res.data) {
        console.log("No CollateralLocked events found");
        return;
      }

      console.log(`Found ${res.data.logs.length} CollateralLocked events`);

      for (let i = 0; i < res.data.logs.length; i++) {
        const log = res.data.logs[i];
        const tx = res.data.transactions.find((t: any) => t.hash === log.transaction_hash);

        if (!tx || tx.from.toLowerCase() !== userAddress.toLowerCase()) continue;

        const iface = new ethers.Interface([
          "event CollateralLocked(address indexed zkToken, address indexed user, uint256 amount, bytes32 commitment)"
        ]);

        const decoded = iface.parseLog({
          topics: [log.topic0, log.topic1, log.topic2, log.topic3].filter(Boolean) as string[],
          data: log.data,
        });

        if (!decoded) continue;

        const commitment = decoded.args[3];
        const amount = decoded.args[2].toString();

        // Update the note with the amount
        const note = this.userNotes[userAddress].notes.find(n => n.commitment === commitment);
        if (note) {
          note.amount = amount;
        }
      }
    } catch (error) {
      console.error("Error indexing CollateralLocked events:", error);
    }
  }

  /**
   * Index CollateralReleased events for withdrawals
   */
  private async indexCollateralReleasedEvents(userAddress: string, fromBlock: number) {
    console.log("Indexing CollateralReleased events...");

    const query: Query = {
      fromBlock: fromBlock,
      logs: [
        {
          address: [CONTRACTS.CollateralManager],
          topics: [
            [ethers.id(EVENT_SIGNATURES.CollateralReleased)],
          ],
        },
      ],
      fieldSelection: {
        log: [
          "block_number",
          "transaction_hash",
          "data",
          "topic0",
          "topic1",
          "topic2",
        ],
        block: ["number", "timestamp"],
        transaction: ["from", "to", "hash"],
      },
    };

    try {
      const res = await this.client.sendReq(query);

      if (!res.data) {
        console.log("No CollateralReleased events found");
        return;
      }

      console.log(`Found ${res.data.logs.length} CollateralReleased events`);

      for (let i = 0; i < res.data.logs.length; i++) {
        const log = res.data.logs[i];
        const tx = res.data.transactions.find((t: any) => t.hash === log.transaction_hash);
        const block = res.data.blocks.find((b: any) => b.number === log.block_number);

        if (!tx || !block) continue;

        if (tx.from.toLowerCase() !== userAddress.toLowerCase()) continue;

        const iface = new ethers.Interface([
          "event CollateralReleased(address indexed zkToken, address indexed user, address recipient, uint256 amount, bytes32 nullifier)"
        ]);

        const decoded = iface.parseLog({
          topics: [log.topic0, log.topic1, log.topic2].filter(Boolean) as string[],
          data: log.data,
        });

        if (!decoded) continue;

        this.userNotes[userAddress].withdrawals.push({
          txHash: tx.hash,
          blockNumber: Number(log.block_number),
          timestamp: Number(block.timestamp),
          from: tx.from,
          to: tx.to,
          eventType: "CollateralReleased",
          eventData: {
            zkToken: decoded.args[0],
            user: decoded.args[1],
            recipient: decoded.args[2],
            amount: decoded.args[3].toString(),
            nullifier: decoded.args[4],
          },
        });
      }
    } catch (error) {
      console.error("Error indexing CollateralReleased events:", error);
    }
  }

  /**
   * Get all transactions for a user
   */
  getUserData(userAddress: string): UserNotes[string] | null {
    return this.userNotes[userAddress.toLowerCase()] || null;
  }

  /**
   * Save indexed data to file
   */
  saveToFile(filePath: string) {
    const data = JSON.stringify(this.userNotes, null, 2);
    fs.writeFileSync(filePath, data);
    console.log(`Saved indexed data to ${filePath}`);
  }

  /**
   * Load indexed data from file
   */
  loadFromFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      this.userNotes = JSON.parse(data);
      console.log(`Loaded indexed data from ${filePath}`);
    }
  }
}

// Example usage
async function main() {
  // Get configuration from environment
  const userAddress = process.env.USER_ADDRESS || "";
  const fromBlock = parseInt(process.env.FROM_BLOCK || "0");

  // Base Sepolia HyperSync endpoint
  const hypersyncUrl = process.env.HYPERSYNC_URL || "https://base-sepolia.hypersync.xyz";

  if (!userAddress) {
    console.error("Please set USER_ADDRESS environment variable");
    process.exit(1);
  }

  // Create indexer
  const indexer = new ShieldedLedgerIndexer(hypersyncUrl, 84532); // Base Sepolia chain ID

  // Index user transactions
  const userData = await indexer.indexUserTransactions(userAddress, fromBlock);

  console.log("\n=== User Transaction Summary ===");
  console.log(`Total deposits: ${userData.deposits.length}`);
  console.log(`Total transfers: ${userData.transfers.length}`);
  console.log(`Total withdrawals: ${userData.withdrawals.length}`);
  console.log(`Total notes: ${userData.notes.length}`);
  console.log(`Unspent notes: ${userData.notes.filter(n => !n.spent).length}`);

  // Save to file
  const outputPath = path.join(process.cwd(), "indexed-data.json");
  indexer.saveToFile(outputPath);

  console.log("\nIndexing complete!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ShieldedLedgerIndexer, UserNotes, IndexedTransaction };
