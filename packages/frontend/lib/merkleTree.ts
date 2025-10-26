import { buildPoseidon } from "circomlibjs";
import { createPublicClient, http, parseAbiItem } from "viem";
import { monadTestnet } from "./config";
import { contractAddresses } from "./addresses";

export class MerkleTree {
  private levels: number;
  private zeroValue: bigint;
  private zeros: bigint[];
  private totalLeaves: number;
  private leaves: Map<number, bigint>;
  private poseidon: {
    (inputs: bigint[]): unknown;
    F: {
      toObject(value: unknown): bigint;
    };
  } | null = null;

  constructor(levels: number, zeroValue: bigint = BigInt(0)) {
    this.levels = levels;
    this.zeroValue = zeroValue;
    this.zeros = [];
    this.totalLeaves = 0;
    this.leaves = new Map();
  }

  async initialize() {
    this.poseidon = await buildPoseidon();

    // Pre-compute zero hashes for each level
    let current = this.zeroValue;
    this.zeros.push(current);

    console.log(`[Merkle Tree] Zero value at level 0: ${current.toString()}`);

    for (let i = 0; i < this.levels; i++) {
      current = this.hash(current, current);
      this.zeros.push(current);
      if (i < 3) { // Log first 3 levels
        console.log(`[Merkle Tree] Zero value at level ${i + 1}: ${current.toString()}`);
      }
    }
  }

  hash(left: bigint, right: bigint): bigint {
    if (!this.poseidon) {
      throw new Error("Poseidon hash function not initialized. Call initialize() first.");
    }
    const hash = this.poseidon([left, right]);
    return this.poseidon.F.toObject(hash);
  }

  insert(leaf: bigint): number {
    const index = this.totalLeaves;
    this.leaves.set(index, leaf);
    this.totalLeaves++;
    return index;
  }

  getLeaf(index: number): bigint {
    return this.leaves.get(index) || this.zeros[0];
  }

  getRoot(): bigint {
    if (this.totalLeaves === 0) {
      return this.zeros[this.levels];
    }
    return this.computeRootFromAllLeaves();
  }

  private computeRootFromAllLeaves(): bigint {
    // Build the entire tree bottom-up
    let currentLevel: bigint[] = [];

    // Start with all leaves at the bottom level
    for (let i = 0; i < Math.pow(2, this.levels); i++) {
      currentLevel.push(this.leaves.get(i) || this.zeros[0]);
    }

    console.log(`[Merkle Tree] Starting with ${currentLevel.length} leaves at level 0`);
    if (this.totalLeaves <= 4) {
      console.log(`[Merkle Tree] First 4 leaves:`, currentLevel.slice(0, 4).map(v => v.toString()));
    }

    // Hash pairs up the tree
    for (let level = 0; level < this.levels; level++) {
      const nextLevel: bigint[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1];
        const hash = this.hash(left, right);
        nextLevel.push(hash);

        // Log first few hashes at each level
        if (level < 3 && i < 4) {
          console.log(`[Merkle Tree] Level ${level}, pair ${i/2}: hash(${left.toString()}, ${right.toString()}) = ${hash.toString()}`);
        }
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  getMerkleProof(index: number): {
    pathElements: bigint[];
    pathIndices: number[];
  } {
    const pathElements: bigint[] = [];
    const pathIndices: number[] = [];

    let currentIndex = index;
    let currentLevel: bigint[] = [];

    // Build the first level (leaves)
    for (let i = 0; i < Math.pow(2, this.levels); i++) {
      currentLevel.push(this.leaves.get(i) || this.zeros[0]);
    }

    // For each level, compute the sibling and hash up
    for (let level = 0; level < this.levels; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      const sibling = currentLevel[siblingIndex];

      pathElements.push(sibling);
      pathIndices.push(isRight ? 1 : 0);

      // Build next level
      const nextLevel: bigint[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        nextLevel.push(this.hash(currentLevel[i], currentLevel[i + 1]));
      }
      currentLevel = nextLevel;

      currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathElements, pathIndices };
  }

  // Build tree from all on-chain commitments
  async buildFromCommitments(commitments: { commitment: string; index: number }[]) {
    await this.initialize();

    // Sort by index
    commitments.sort((a, b) => a.index - b.index);

    console.log(`[Merkle Tree] Building tree from ${commitments.length} commitments`);

    // Insert all commitments
    for (const { commitment, index } of commitments) {
      while (this.totalLeaves < index) {
        this.insert(this.zeros[0]); // Insert zero leaves for gaps
      }
      const leafValue = BigInt(commitment);
      console.log(`[Merkle Tree] Inserting commitment at index ${index}: ${commitment} (decimal: ${leafValue.toString()})`);
      this.insert(leafValue);
    }

    const root = this.getRoot();
    console.log(`[Merkle Tree] Computed root: ${root.toString()} (hex: 0x${root.toString(16)})`);
    return root;
  }
}

export async function fetchAllCommitments() {
  console.log("[Merkle Tree] Fetching all commitments using HyperSync API...");

  // Get the first mint block from localStorage for efficient indexing
  const firstMintBlock = localStorage.getItem('zkERC20-first-mint-block') || '0';
  console.log(`[Merkle Tree] Starting from block: ${firstMintBlock}`);

  try {
    // Use our HyperSync indexer API which doesn't have the 100-block limitation
    // Pass allNotes=true to get all commitments (not filtered by user) for Merkle tree
    const response = await fetch(`/api/hypersync-indexer?address=${contractAddresses.zkERC20}&fromBlock=${firstMintBlock}&allNotes=true`);

    if (!response.ok) {
      throw new Error(`HyperSync API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Merkle Tree] HyperSync found ${data.notes.length} notes`);

    // Convert notes to commitments with indices
    return data.notes.map((note: { commitment: string; index: number }) => ({
      commitment: note.commitment,
      index: note.index,
    }));
  } catch (error) {
    console.error("[Merkle Tree] HyperSync API failed, falling back to RPC...", error);

    // Fallback to RPC with chunking
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(),
    });

    const currentBlock = await publicClient.getBlockNumber();
    const BLOCK_RANGE = BigInt(100);
    interface LogResult {
      args: {
        commitment?: `0x${string}` | undefined;
        index?: bigint | undefined;
        encryptedNote?: `0x${string}` | undefined;
      };
    }
    const allLogs: LogResult[] = [];

    console.log(`[Merkle Tree] Fetching logs from block 0 to ${currentBlock} in chunks of ${BLOCK_RANGE}...`);

    for (let fromBlock = BigInt(0); fromBlock <= currentBlock; fromBlock += BLOCK_RANGE) {
      const toBlock = fromBlock + BLOCK_RANGE - BigInt(1) > currentBlock
        ? currentBlock
        : fromBlock + BLOCK_RANGE - BigInt(1);

      console.log(`[Merkle Tree] Fetching blocks ${fromBlock} to ${toBlock}...`);

      try {
        const logs = await publicClient.getLogs({
          address: contractAddresses.zkERC20,
          event: parseAbiItem(
            "event NoteCommitted(bytes32 indexed commitment, uint256 index, bytes encryptedNote)"
          ),
          fromBlock,
          toBlock,
        });

        allLogs.push(...logs);
        console.log(`[Merkle Tree] Found ${logs.length} events in this range`);
      } catch (error) {
        console.error(`[Merkle Tree] Error fetching blocks ${fromBlock}-${toBlock}:`, error);
      }
    }

    console.log(`[Merkle Tree] Total events found: ${allLogs.length}`);

    return allLogs
      .filter((log) => log.args.commitment && log.args.index !== undefined)
      .map((log) => ({
        commitment: log.args.commitment as string,
        index: Number(log.args.index),
      }));
  }
}
