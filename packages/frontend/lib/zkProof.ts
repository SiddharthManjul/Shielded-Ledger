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

// TODO: Implement transfer and withdraw proof generation following the same pattern
export async function generateTransferProof(/* params */): Promise<any> {
  throw new Error("Transfer proof generation not yet implemented");
}

export async function generateWithdrawProof(/* params */): Promise<any> {
  throw new Error("Withdraw proof generation not yet implemented");
}