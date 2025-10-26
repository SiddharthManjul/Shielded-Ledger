import { DepositProof } from '@/types/contracts';
// @ts-ignore - snarkjs types
import * as snarkjs from 'snarkjs';

// Real ZK proof generation using compiled circuits
export async function generateDepositProof(
  amount: bigint,
  secret?: string,
  nullifier?: string
): Promise<DepositProof> {
  try {
    // Generate random secret and nullifier if not provided
    const secretBigInt = secret ? BigInt(secret) : BigInt(Math.floor(Math.random() * 1000000000000));
    const nullifierBigInt = nullifier ? BigInt(nullifier) : BigInt(Math.floor(Math.random() * 1000000000000));

    console.log("Generating real ZK proof with snarkjs...");
    console.log("Input values:", { amount, secretBigInt, nullifierBigInt });

    // Prepare circuit inputs
    const circuitInputs = {
      amount: amount.toString(),
      secret: secretBigInt.toString(),
      nullifier: nullifierBigInt.toString()
    };

    console.log("Circuit inputs:", circuitInputs);

    // Generate witness and proof using snarkjs
    // Load WASM and zkey from the circuits package
    const wasmPath = '/circuits/deposit_js/deposit.wasm';
    const zkeyPath = '/circuits/deposit_0001.zkey';

    console.log("Loading circuit files...");

    // Fetch circuit files
    const wasmResponse = await fetch(wasmPath);
    const zkeyResponse = await fetch(zkeyPath);

    if (!wasmResponse.ok || !zkeyResponse.ok) {
      throw new Error("Failed to load circuit files. Make sure they are in the public folder.");
    }

    const wasmBuffer = await wasmResponse.arrayBuffer();
    const zkeyBuffer = await zkeyResponse.arrayBuffer();

    console.log("Generating proof with snarkjs.groth16.fullProve...");

    // Generate the proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      new Uint8Array(wasmBuffer),
      new Uint8Array(zkeyBuffer)
    );

    console.log("Proof generated successfully!");
    console.log("Public signals:", publicSignals);
    console.log("Proof:", proof);

    // Extract commitment and nullifierHash from public signals
    const commitment = BigInt(publicSignals[0]);
    const nullifierHash = BigInt(publicSignals[1]);

    // Convert proof to the format expected by the contract
    const zkProof: DepositProof = {
      a: [
        BigInt(proof.pi_a[0]),
        BigInt(proof.pi_a[1])
      ],
      b: [
        [
          BigInt(proof.pi_b[0][1]), // Note: coordinates are reversed in snarkjs
          BigInt(proof.pi_b[0][0])
        ],
        [
          BigInt(proof.pi_b[1][1]),
          BigInt(proof.pi_b[1][0])
        ]
      ],
      c: [
        BigInt(proof.pi_c[0]),
        BigInt(proof.pi_c[1])
      ],
      commitment,
      nullifier: nullifierHash
    };

    console.log("Final ZK proof:", zkProof);

    return zkProof;
  } catch (error) {
    console.error("Error generating ZK proof:", error);
    throw new Error(`Failed to generate ZK proof: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export interface TransferProof {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
  inputNullifiers: [string, string];
  outputCommitments: [string, string];
  merkleRoot: string;
}

export async function generateTransferProof(
  inputNotes: {
    amount: bigint;
    secret: string;
    nullifier: string;
    merklePathIndices: number[];
    merklePathElements: string[];
  }[],
  outputAmounts: [bigint, bigint],
  outputSecrets: [string, string],
  outputNullifiers: [string, string],
  merkleRoot: string
): Promise<TransferProof> {
  try {
    if (inputNotes.length !== 2) {
      throw new Error("Transfer requires exactly 2 input notes");
    }

    console.log("Generating real ZK proof for transfer with snarkjs...");
    console.log("Input notes:", inputNotes);
    console.log("Output amounts:", outputAmounts);

    // Prepare circuit inputs for transfer
    // The circuit expects arrays, not individual indexed values
    const circuitInputs = {
      // Input notes - as arrays
      inputAmounts: [
        inputNotes[0].amount.toString(),
        inputNotes[1].amount.toString()
      ],
      inputSecrets: [
        inputNotes[0].secret,
        inputNotes[1].secret
      ],
      inputNullifiers: [
        inputNotes[0].nullifier,
        inputNotes[1].nullifier
      ],

      // Merkle proofs - as 2D arrays
      inputPathElements: [
        inputNotes[0].merklePathElements,
        inputNotes[1].merklePathElements
      ],
      inputPathIndices: [
        inputNotes[0].merklePathIndices,
        inputNotes[1].merklePathIndices
      ],

      // Output notes - as arrays
      outputAmounts: [
        outputAmounts[0].toString(),
        outputAmounts[1].toString()
      ],
      outputSecrets: [
        outputSecrets[0],
        outputSecrets[1]
      ],
      outputNullifiers: [
        outputNullifiers[0],
        outputNullifiers[1]
      ],

      // Merkle root - single value (public input)
      // Convert hex string to decimal string for circuit
      merkleRoot: BigInt(merkleRoot).toString(),
    };

    console.log("Circuit inputs:", circuitInputs);
    console.log("Merkle root (hex):", merkleRoot);
    console.log("Merkle root (decimal):", BigInt(merkleRoot).toString());
    console.log("Input 1 amount:", circuitInputs.inputAmounts[0]);
    console.log("Input 1 secret:", circuitInputs.inputSecrets[0]);
    console.log("Input 1 nullifier:", circuitInputs.inputNullifiers[0]);
    console.log("Input 2 amount:", circuitInputs.inputAmounts[1]);
    console.log("Input 2 secret:", circuitInputs.inputSecrets[1]);
    console.log("Input 2 nullifier:", circuitInputs.inputNullifiers[1]);
    console.log("Input 1 pathElements:", circuitInputs.inputPathElements[0]);
    console.log("Input 1 pathIndices:", circuitInputs.inputPathIndices[0]);
    console.log("Input 2 pathElements:", circuitInputs.inputPathElements[1]);
    console.log("Input 2 pathIndices:", circuitInputs.inputPathIndices[1]);

    // Load WASM and zkey from the circuits package
    const wasmPath = '/circuits/transfer_js/transfer.wasm';
    const zkeyPath = '/circuits/transfer_0001.zkey';

    console.log("Loading transfer circuit files...");

    // Fetch circuit files
    const wasmResponse = await fetch(wasmPath);
    const zkeyResponse = await fetch(zkeyPath);

    if (!wasmResponse.ok || !zkeyResponse.ok) {
      throw new Error("Failed to load transfer circuit files. Make sure they are in the public folder.");
    }

    const wasmBuffer = await wasmResponse.arrayBuffer();
    const zkeyBuffer = await zkeyResponse.arrayBuffer();

    console.log("Generating transfer proof with snarkjs.groth16.fullProve...");

    // Generate the proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      new Uint8Array(wasmBuffer),
      new Uint8Array(zkeyBuffer)
    );

    console.log("Transfer proof generated successfully!");
    console.log("Public signals:", publicSignals);
    console.log("Proof:", proof);

    // Extract public signals
    // Public signals format: [inputNullifier1, inputNullifier2, outputCommitment1, outputCommitment2]
    // Note: merkleRoot is a public input but not in publicSignals output
    const inputNullifier1 = publicSignals[0];
    const inputNullifier2 = publicSignals[1];
    const outputCommitment1 = publicSignals[2];
    const outputCommitment2 = publicSignals[3];

    // Convert proof to the format expected by the contract
    const zkProof: TransferProof = {
      a: [
        BigInt(proof.pi_a[0]),
        BigInt(proof.pi_a[1])
      ],
      b: [
        [
          BigInt(proof.pi_b[0][1]),
          BigInt(proof.pi_b[0][0])
        ],
        [
          BigInt(proof.pi_b[1][1]),
          BigInt(proof.pi_b[1][0])
        ]
      ],
      c: [
        BigInt(proof.pi_c[0]),
        BigInt(proof.pi_c[1])
      ],
      inputNullifiers: [
        "0x" + BigInt(inputNullifier1).toString(16).padStart(64, '0'),
        "0x" + BigInt(inputNullifier2).toString(16).padStart(64, '0')
      ],
      outputCommitments: [
        "0x" + BigInt(outputCommitment1).toString(16).padStart(64, '0'),
        "0x" + BigInt(outputCommitment2).toString(16).padStart(64, '0')
      ],
      merkleRoot: "0x" + BigInt(merkleRoot).toString(16).padStart(64, '0')
    };

    console.log("Final transfer ZK proof:", zkProof);

    return zkProof;
  } catch (error) {
    console.error("Error generating transfer ZK proof:", error);
    throw new Error(`Failed to generate transfer ZK proof: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateWithdrawProof(/* params */): Promise<any> {
  throw new Error("Withdraw proof generation not yet implemented");
}