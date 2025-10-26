import { NextRequest, NextResponse } from "next/server";
import { contractAddresses } from "@/lib/addresses";

// Dynamic import to avoid Turbopack bundling issues with native modules
// HyperSync is a native Node module (NAPI-RS) that can't be bundled by Turbopack
async function getHypersync() {
  const hypersync = await import('@envio-dev/hypersync-client');
  return hypersync;
}

// Event signatures
const COLLATERAL_LOCKED_SIGNATURE = "0xae7d0e244967d1d55809231f77a6b423ba7fc44647dcb7889f6ae77029175d08"; // CollateralLocked(address,address,uint256,bytes32)
const NOTE_COMMITTED_SIGNATURE = "0x7de4af0af526d60801c09e058cb312c537ebd0ac1fc7b85f5072a5df2a48930b"; // NoteCommitted(bytes32,uint256,bytes)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userAddress = searchParams.get("address");
  const fromBlockParam = searchParams.get("fromBlock") || "0";
  const allNotes = searchParams.get("allNotes") === "true"; // Flag to get all notes for Merkle tree

  if (!userAddress) {
    return NextResponse.json(
      { error: "Missing address parameter" },
      { status: 400 }
    );
  }

  try {
    console.log(`[HyperSync API] Starting indexing...`);
    console.log(`[HyperSync API] Parameters:`, { userAddress, fromBlockParam, allNotes });

    // Dynamically import hypersync client to avoid Turbopack bundling issues
    const { HypersyncClient, LogField, JoinMode } = await getHypersync();

    const client = HypersyncClient.new({
      url: "https://monad-testnet.hypersync.xyz",
      maxNumRetries: 5,
      httpReqTimeoutMillis: 60000
    });

    // Query for CollateralLocked events
    // If allNotes=true, get all events; otherwise filter by user address
    const collateralQuery = {
      fromBlock: parseInt(fromBlockParam),
      logs: [
        {
          address: [contractAddresses.CollateralManager.toLowerCase()],
          topics: allNotes ? [
            [COLLATERAL_LOCKED_SIGNATURE],
            [contractAddresses.zkERC20.toLowerCase().padEnd(66, '0')], // zkToken address (indexed)
            // Don't filter by user - get all notes for Merkle tree
          ] : [
            [COLLATERAL_LOCKED_SIGNATURE],
            [contractAddresses.zkERC20.toLowerCase().padEnd(66, '0')], // zkToken address (indexed)
            ["0x" + userAddress.toLowerCase().slice(2).padStart(64, '0')] // user address (indexed)
          ]
        }
      ],
      fieldSelection: {
        log: [
          LogField.BlockNumber,
          LogField.TransactionHash,
          LogField.LogIndex,
          LogField.Data,
          LogField.Topic0,
          LogField.Topic1,
          LogField.Topic2,
          LogField.Topic3
        ]
      },
      joinMode: JoinMode.JoinNothing
    };

    console.log(`[HyperSync API] Querying CollateralLocked events...`);
    const collateralReceiver = await client.stream(collateralQuery, {});
    const collateralLogs: any[] = [];

    while (true) {
      const res = await collateralReceiver.recv();
      if (res === null) break;

      if (res.data.logs && res.data.logs.length > 0) {
        collateralLogs.push(...res.data.logs);
      }
    }

    console.log(`[HyperSync API] Found ${collateralLogs.length} CollateralLocked events`);

    // Debug: Log first collateral event structure
    if (collateralLogs.length > 0) {
      console.log("[HyperSync API] Sample CollateralLocked event:", JSON.stringify(collateralLogs[0], null, 2));
    }

    // Extract commitments from CollateralLocked events
    const commitments = collateralLogs.map(log => log.topic3);

    if (commitments.length === 0 && !allNotes) {
      console.log(`[HyperSync API] No collateral locked events found for user`);
      return NextResponse.json({
        deposits: [],
        transfers: [],
        withdrawals: [],
        notes: [],
        totalBalance: "0",
        blockRange: {
          from: fromBlockParam,
          to: "latest",
          current: "latest",
          hasMore: false,
        },
      });
    }

    // If allNotes=true and no CollateralLocked events, query ALL NoteCommitted events instead
    if (commitments.length === 0 && allNotes) {
      console.log(`[HyperSync API] No CollateralLocked events found. Querying ALL NoteCommitted events for Merkle tree...`);

      // Query ALL NoteCommitted events (no filtering)
      const allNotesQuery = {
        fromBlock: parseInt(fromBlockParam),
        logs: [
          {
            address: [contractAddresses.zkERC20.toLowerCase()],
            topics: [
              [NOTE_COMMITTED_SIGNATURE]
              // No commitment filter - get ALL
            ]
          }
        ],
        fieldSelection: {
          log: [
            LogField.BlockNumber,
            LogField.TransactionHash,
            LogField.LogIndex,
            LogField.Data,
            LogField.Topic0,
            LogField.Topic1
          ]
        },
        joinMode: JoinMode.JoinNothing
      };

      const allNotesReceiver = await client.stream(allNotesQuery, {});
      const allNotesLogs: any[] = [];

      while (true) {
        const res = await allNotesReceiver.recv();
        if (res === null) break;
        if (res.data.logs && res.data.logs.length > 0) {
          allNotesLogs.push(...res.data.logs);
        }
      }

      console.log(`[HyperSync API] Found ${allNotesLogs.length} total NoteCommitted events`);

      if (allNotesLogs.length > 0) {
        console.log("[HyperSync API] Sample NoteCommitted event:", JSON.stringify(allNotesLogs[0], null, 2));
      }

      // Sort logs by block number and log index to ensure correct order
      allNotesLogs.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return a.blockNumber - b.blockNumber;
        }
        return a.logIndex - b.logIndex;
      });

      // Process all notes with sequential indices
      const notes = allNotesLogs.map((noteLog, idx) => {
        // Event NoteCommitted(bytes32 indexed commitment, uint256 index, bytes encryptedNote)
        // topics[0] = event signature
        // topics[1] = commitment (indexed)
        // data contains: index and encryptedNote (non-indexed)

        const commitment = noteLog.topic1 || (noteLog.topics ? noteLog.topics[1] : null);
        const dataHex = noteLog.data.startsWith('0x') ? noteLog.data.slice(2) : noteLog.data;

        // Use sequential index based on order of events
        // This matches how the contract increments noteCount
        const index = idx;
        const length = parseInt(dataHex.slice(64, 128), 16);
        const encryptedNote = "0x" + dataHex.slice(128, 128 + length * 2);

        console.log("[HyperSync API] Processing note:", { commitment, index, blockNumber: noteLog.blockNumber, logIndex: noteLog.logIndex });

        return {
          commitment: commitment,
          index: index,
          amount: "0", // We don't have amount without CollateralLocked
          spent: false,
          encryptedNote: encryptedNote,
          sender: "0x0000000000000000000000000000000000000000", // Not available without CollateralLocked
          blockNumber: noteLog.blockNumber.toString(),
          transactionHash: noteLog.transactionHash,
        };
      });

      return NextResponse.json({
        deposits: [],
        transfers: [],
        withdrawals: [],
        notes,
        totalBalance: "0",
        blockRange: {
          from: fromBlockParam,
          to: "latest",
          current: "latest",
          hasMore: false,
        },
      });
    }

    // Query for NoteCommitted events matching these commitments
    const noteQuery = {
      fromBlock: parseInt(fromBlockParam),
      logs: [
        {
          address: [contractAddresses.zkERC20.toLowerCase()],
          topics: [
            [NOTE_COMMITTED_SIGNATURE],
            commitments // Filter by specific commitments
          ]
        }
      ],
      fieldSelection: {
        log: [
          LogField.BlockNumber,
          LogField.TransactionHash,
          LogField.LogIndex,
          LogField.Data,
          LogField.Topic0,
          LogField.Topic1
        ]
      },
      joinMode: JoinMode.JoinNothing
    };

    console.log(`[HyperSync API] Querying NoteCommitted events...`);
    const noteReceiver = await client.stream(noteQuery, {});
    const noteLogs: any[] = [];

    while (true) {
      const res = await noteReceiver.recv();
      if (res === null) break;

      if (res.data.logs && res.data.logs.length > 0) {
        noteLogs.push(...res.data.logs);
      }
    }

    console.log(`[HyperSync API] Found ${noteLogs.length} NoteCommitted events`);

    // Debug: Log first note event structure
    if (noteLogs.length > 0) {
      console.log("[HyperSync API] Sample NoteCommitted event:", JSON.stringify(noteLogs[0], null, 2));
    }

    // Match CollateralLocked with NoteCommitted events
    const notes: any[] = [];
    const deposits: any[] = [];

    for (const collateralLog of collateralLogs) {
      const commitment = collateralLog.topic3; // commitment is topic3
      const amount = collateralLog.data; // amount is in data field

      // Find matching NoteCommitted event
      const noteLog = noteLogs.find((nl: any) => nl.topic1 === commitment);

      if (noteLog) {
        // Parse the data field for NoteCommitted: (uint256 index, bytes encryptedNote)
        // ABI encoding: [index (32 bytes)][offset to bytes (32 bytes)][length of bytes (32 bytes)][bytes data]
        const dataHex = noteLog.data.startsWith('0x') ? noteLog.data.slice(2) : noteLog.data;

        // First 64 chars (32 bytes) = index
        const index = parseInt(dataHex.slice(0, 64), 16);

        // Next 64 chars (32 bytes) = offset to bytes array (usually 0x40 = 64) - we skip this

        // Next 64 chars (32 bytes) = length of bytes array
        const length = parseInt(dataHex.slice(128, 192), 16);

        // Remaining data is the encryptedNote bytes
        const encryptedNote = "0x" + dataHex.slice(192, 192 + length * 2);

        notes.push({
          commitment: commitment,
          index: index,
          amount: amount ? BigInt(amount).toString() : "0",
          spent: false,
          encryptedNote: encryptedNote,
        });

        deposits.push({
          txHash: collateralLog.transactionHash,
          blockNumber: Number(collateralLog.blockNumber),
          timestamp: 0,
          commitment: commitment,
          amount: amount ? BigInt(amount).toString() : "0",
          index: index,
          encryptedNote: encryptedNote,
        });
      }
    }

    console.log(`[HyperSync API] Processed ${notes.length} notes`);

    const result = {
      deposits,
      transfers: [],
      withdrawals: [],
      notes,
      totalBalance: notes
        .filter((n) => !n.spent)
        .reduce((sum, n) => sum + BigInt(n.amount || "0"), BigInt(0))
        .toString(),
      blockRange: {
        from: fromBlockParam,
        to: "latest",
        current: "latest",
        hasMore: false,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[HyperSync API] Error fetching indexed data:", error);
    console.error("[HyperSync API] Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      {
        error: "Failed to fetch indexed data",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
