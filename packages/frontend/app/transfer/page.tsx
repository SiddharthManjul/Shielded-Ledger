"use client";

import { Navigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GamingCard } from "@/components/ui/gaming-card";
import { Input } from "@/components/ui/input";
import { contractAddresses } from "@/lib/config";
import { abis } from "@/lib/contracts";
import { generateTransferProof } from "@/lib/zkProof";
import { MerkleTree, fetchAllCommitments } from "@/lib/merkleTree";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Send,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSignMessage } from "wagmi";

export default function TransferPage() {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const router = useRouter();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [, setAuthState] = useState(0);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isAuthenticated = isConnected && localStorage.getItem("shielded-ledger-auth") === address;

  const handleSignMessage = () => {
    if (!address) return;

    signMessage(
      {
        message: `Sign this message to authenticate with Shielded Ledger.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`,
      },
      {
        onSuccess: () => {
          localStorage.setItem("shielded-ledger-auth", address);
          setAuthState(prev => prev + 1);
        },
        onError: (error) => {
          console.error("Error signing message:", error);
        },
      }
    );
  };

  // Read zkERC20 data
  const { data: zkTokenSymbolRaw } = useReadContract({
    address: contractAddresses.zkERC20,
    abi: abis.zkERC20,
    functionName: "symbol",
    query: {
      enabled: isAuthenticated,
    },
  });

  // Convert to string for type safety
  const zkTokenSymbol = zkTokenSymbolRaw ? String(zkTokenSymbolRaw) : undefined;

  const { data: merkleRoot } = useReadContract({
    address: contractAddresses.zkERC20,
    abi: abis.zkERC20,
    functionName: "getMerkleRoot",
    query: {
      enabled: isAuthenticated,
    },
  });

  const handleTransfer = async () => {
    if (!amount || !recipientAddress || !address || !merkleRoot) {
      alert("Please enter recipient address and amount, and wait for merkle root to load");
      return;
    }

    try {
      setIsGeneratingProof(true);

      // Fetch user's notes from localStorage
      const storedNotes = localStorage.getItem(`notes-${address}`);
      if (!storedNotes) {
        alert("No notes found. Please mint some tokens first.");
        setIsGeneratingProof(false);
        return;
      }

      const userNotes = JSON.parse(storedNotes);
      if (userNotes.length === 0) {
        alert("No notes found. Please mint some tokens first.");
        setIsGeneratingProof(false);
        return;
      }

      const transferAmount = parseUnits(amount, 18);

      // For demo: use the first note as input
      // IMPORTANT: Transfer circuit requires EXACTLY 2 input notes
      const inputNote1 = userNotes[0];

      // Check if we have a second note
      if (!userNotes[1]) {
        alert("Transfer requires at least 2 deposited notes. Please deposit at least 2 tokens first, then try again.");
        setIsGeneratingProof(false);
        return;
      }

      const inputNote2 = userNotes[1];

      // Validate first note has enough balance
      if (BigInt(inputNote1.amount) < transferAmount) {
        alert(`Insufficient balance. You have ${inputNote1.amount} wei but trying to transfer ${transferAmount.toString()} wei`);
        setIsGeneratingProof(false);
        return;
      }

      // Generate random secrets and nullifiers for outputs
      const outputSecret1 = Math.floor(Math.random() * 1000000000000).toString();
      const outputSecret2 = Math.floor(Math.random() * 1000000000000).toString();
      const outputNullifier1 = Math.floor(Math.random() * 1000000000000).toString();
      const outputNullifier2 = Math.floor(Math.random() * 1000000000000).toString();

      // Build Merkle tree from all commitments to generate proofs
      console.log("Fetching all commitments from blockchain...");
      const commitments = await fetchAllCommitments();
      console.log(`Found ${commitments.length} commitments`);
      console.log("All commitments:", commitments);

      const tree = new MerkleTree(20);
      await tree.buildFromCommitments(commitments);

      const computedRoot = tree.getRoot();
      console.log("Computed merkle root:", "0x" + computedRoot.toString(16));
      console.log("On-chain merkle root:", merkleRoot);

      if ("0x" + computedRoot.toString(16) !== merkleRoot) {
        console.log("⚠️ Merkle roots don't match!");
        console.log("Computed:", "0x" + computedRoot.toString(16));
        console.log("On-chain:", merkleRoot);
      }

      // Get Merkle proofs for input notes
      const commitment1 = BigInt(inputNote1.commitment);
      const noteIndex1 = commitments.findIndex((c: { commitment: string }) => BigInt(c.commitment) === commitment1);

      if (noteIndex1 === -1) {
        throw new Error("Input note 1 not found in Merkle tree");
      }

      const proof1 = tree.getMerkleProof(noteIndex1);
      console.log("Proof 1:", proof1);
      console.log("Note 1 details:", {
        commitment: inputNote1.commitment,
        index: noteIndex1,
        amount: inputNote1.amount,
        secret: inputNote1.secret,
        nullifier: inputNote1.nullifier
      });

      // Get proof for second input note
      const commitment2 = BigInt(inputNote2.commitment);
      const noteIndex2 = commitments.findIndex((c: { commitment: string }) => BigInt(c.commitment) === commitment2);

      if (noteIndex2 === -1) {
        throw new Error("Input note 2 not found in Merkle tree");
      }

      const proof2 = tree.getMerkleProof(noteIndex2);
      console.log("Proof 2:", proof2);
      console.log("Note 2 details:", {
        commitment: inputNote2.commitment,
        index: noteIndex2,
        amount: inputNote2.amount,
        secret: inputNote2.secret,
        nullifier: inputNote2.nullifier
      });

      // Prepare input notes with real merkle proofs
      const inputNotes = [
        {
          amount: BigInt(inputNote1.amount),
          secret: inputNote1.secret || "0",
          nullifier: inputNote1.nullifier || "0",
          merklePathIndices: proof1.pathIndices,
          merklePathElements: proof1.pathElements.map(e => e.toString()),
        },
        {
          amount: BigInt(inputNote2.amount || "0"),
          secret: inputNote2.secret || "0",
          nullifier: inputNote2.nullifier || "0",
          merklePathIndices: proof2.pathIndices,
          merklePathElements: proof2.pathElements.map(e => e.toString()),
        },
      ];

      console.log("Generating transfer proof...");
      console.log("Using merkle root:", merkleRoot);
      console.log("Input notes with real Merkle proofs:", inputNotes);

      const proof = await generateTransferProof(
        inputNotes,
        [transferAmount, BigInt(0)],
        [outputSecret1, outputSecret2],
        [outputNullifier1, outputNullifier2],
        (merkleRoot as `0x${string}`)
      );

      console.log("Transfer proof generated:", proof);

      // Convert proof values for contract call
      const proofA: [bigint, bigint] = proof.a;
      const proofB: [[bigint, bigint], [bigint, bigint]] = proof.b;
      const proofC: [bigint, bigint] = proof.c;

      // Encrypted notes (placeholder - in production, encrypt for recipient)
      const encryptedNote1 = ("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')) as `0x${string}`;
      const encryptedNote2 = ("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')) as `0x${string}`;

      setIsGeneratingProof(false);

      console.log("Calling transfer on zkERC20 contract...");
      writeContract({
        address: contractAddresses.zkERC20,
        abi: abis.zkERC20,
        functionName: "transfer",
        args: [
          proof.inputNullifiers as [`0x${string}`, `0x${string}`],
          proof.outputCommitments as [`0x${string}`, `0x${string}`],
          proof.merkleRoot as `0x${string}`,
          [encryptedNote1, encryptedNote2],
          proofA,
          proofB,
          proofC,
        ],
      }, {
        onSuccess: (hash) => {
          console.log("Transfer transaction submitted:", hash);
        },
        onError: (error) => {
          console.error("Transfer failed:", error);
          alert(`Transfer failed: ${error.message}`);
        }
      });
    } catch (error) {
      console.error("Error during transfer:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setIsGeneratingProof(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }, [isSuccess, router]);

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="mx-auto px-4 py-8 container">
        <Navigation />

        {/* Header */}
        <div className="mx-auto mb-8 max-w-6xl">
          <div className="mb-8 text-center">
            <Badge variant="gaming" className="mb-4">
              <Send className="mr-2 w-4 h-4" />
              Confidential Transfer
            </Badge>
            <h1 className="mb-4 font-display font-bold text-5xl">
              <span className="text-yellow-accent">Private</span> Token Transfer
            </h1>
            <p className="mx-auto max-w-3xl text-muted-foreground text-xl">
              Send confidential tokens to any address with complete privacy
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="mx-auto max-w-2xl">
            <GamingCard className="p-8 text-center">
              <Shield className="mx-auto mb-4 w-16 h-16 text-yellow-accent" />
              <h2 className="mb-4 font-bold text-2xl">Connect Your Wallet</h2>
              <p className="mb-6 text-muted-foreground">
                Please connect your wallet and sign a message to transfer confidential tokens
              </p>
              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      onClick={openConnectModal}
                      className="h-12"
                      size="lg"
                    >
                      <Shield className="mr-2 w-5 h-5" />
                      Connect Wallet
                    </Button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <Button
                  onClick={handleSignMessage}
                  className="h-12"
                  size="lg"
                >
                  Sign Message to Continue
                </Button>
              )}
            </GamingCard>
          </div>
        ) : isSuccess ? (
          <div className="mx-auto max-w-2xl">
            <GamingCard variant="action" glowColor="green" className="space-y-8 p-8 text-center">
              <div className="flex justify-center items-center bg-green-500/20 mx-auto border-2 border-green-400/30 w-20 h-20">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>

              <div>
                <h2 className="mb-3 font-display font-bold text-white text-3xl">
                  Transfer Successful!
                </h2>
                <p className="text-muted-foreground text-lg">
                  Your confidential tokens have been sent privately
                </p>
              </div>

              {hash && (
                <GamingCard className="space-y-4 bg-muted/20 p-6">
                  <h3 className="mb-4 font-semibold text-white text-lg">
                    Transaction Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Transaction Hash:</span>
                      <span className="bg-yellow-accent/10 px-2 py-1 rounded font-mono text-yellow-accent">
                        {hash.slice(0, 10)}...{hash.slice(-8)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold text-white">
                        <span className="font-numbers text-xl">{amount}</span>{" "}
                        {zkTokenSymbol || "zkToken"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="gaming-green">
                        <CheckCircle className="mr-1 w-3 h-3" />
                        Confirmed
                      </Badge>
                    </div>
                  </div>
                </GamingCard>
              )}

              <div className="flex sm:flex-row flex-col gap-4">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 h-12"
                  size="lg"
                >
                  View Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    setRecipientAddress("");
                    setAmount("");
                    window.location.reload();
                  }}
                  variant="outline"
                  className="flex-1 h-12"
                  size="lg"
                >
                  Make Another Transfer
                </Button>
              </div>
            </GamingCard>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
              {/* Left Info Panel */}
              <div className="lg:col-span-1">
                <GamingCard className="p-6">
                  <h3 className="flex items-center gap-2 mb-6 font-semibold text-white text-xl">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                    Transfer Info
                  </h3>
                  <div className="space-y-4 text-muted-foreground text-sm">
                    <div className="flex gap-3">
                      <div className="flex shrink-0 justify-center items-center bg-yellow-accent/20 mt-0.5 w-6 h-6">
                        <span className="font-numbers font-bold text-yellow-accent text-xs">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Zero-Knowledge Privacy</p>
                        <p>Transfer amounts and recipients remain completely private</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex shrink-0 justify-center items-center bg-yellow-accent/20 mt-0.5 w-6 h-6">
                        <span className="font-numbers font-bold text-yellow-accent text-xs">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Instant Settlement</p>
                        <p>Transactions are confirmed on-chain immediately</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex shrink-0 justify-center items-center bg-yellow-accent/20 mt-0.5 w-6 h-6">
                        <span className="font-numbers font-bold text-yellow-accent text-xs">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Secure Proofs</p>
                        <p>ZK-SNARKs ensure cryptographic security</p>
                      </div>
                    </div>
                  </div>
                </GamingCard>
              </div>

              {/* Right Transfer Panel */}
              <div className="lg:col-span-2">
                <GamingCard className="space-y-8 p-8">
                  <div>
                    <h3 className="mb-2 font-semibold text-white text-2xl">Transfer Details</h3>
                    <p className="text-muted-foreground text-sm">
                      Enter the recipient address and amount to transfer
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block mb-2 font-semibold text-white text-sm">
                        Recipient Address
                      </label>
                      <Input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="0x... (Enter recipient address)"
                        className="bg-input border-border focus:border-yellow-accent corner-cut"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold text-white text-sm">
                        Amount
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.0"
                          step="any"
                          className="bg-input pr-24 border-border focus:border-yellow-accent h-14 text-xl corner-cut"
                        />
                        {zkTokenSymbol && (
                          <div className="top-1/2 right-3 absolute font-medium text-muted-foreground text-sm -translate-y-1/2">
                            {zkTokenSymbol}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 corner-cut p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-300">
                          <strong>Note:</strong> This is a demo implementation. In production,
                          the transfer would select your unspent notes automatically and calculate
                          change. Make sure you have sufficient balance in your dashboard.
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleTransfer}
                    disabled={
                      isPending ||
                      isConfirming ||
                      isGeneratingProof ||
                      !recipientAddress ||
                      !amount
                    }
                    className="w-full h-14 text-lg"
                    size="lg"
                  >
                    {isGeneratingProof ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Generating ZK Proof...
                      </>
                    ) : isPending || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 w-5 h-5" />
                        Transfer {amount || "0"} Tokens
                      </>
                    )}
                  </Button>

                  {hash && !isSuccess && (
                    <GamingCard className="bg-muted/20 p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex justify-center items-center bg-yellow-accent/20 w-10 h-10">
                          {isConfirming ? (
                            <Loader2 className="w-5 h-5 text-yellow-accent animate-spin" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-yellow-accent" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white text-base">
                            Transaction {isConfirming ? "Confirming..." : "Submitted"}
                          </p>
                          <p className="font-mono text-muted-foreground text-sm">
                            {hash.slice(0, 20)}...{hash.slice(-20)}
                          </p>
                        </div>
                      </div>
                    </GamingCard>
                  )}
                </GamingCard>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
