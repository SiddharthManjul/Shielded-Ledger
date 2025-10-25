"use client";

import { Navigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GamingCard } from "@/components/ui/gaming-card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { contractAddresses } from "@/lib/config";
import { abis } from "@/lib/contracts";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Coins,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSignMessage } from "wagmi";
import { generateDepositProof } from "@/lib/zkProof";

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const router = useRouter();
  const [collateralToken, setCollateralToken] = useState<`0x${string}`>("0x");
  const [amount, setAmount] = useState("");
  type StepType = "input" | "approve" | "mint" | "success";
  const [step, setStep] = useState<StepType>("input");
  const [, setAuthState] = useState(0); // Force re-render trigger
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [hasLaunchContext, setHasLaunchContext] = useState(false);
  const [launchTokenName, setLaunchTokenName] = useState("");
  const [launchTokenSymbol, setLaunchTokenSymbol] = useState("");
  
  // Pre-populate from URL parameters
  useEffect(() => {
    // Use a timeout to ensure the page has fully loaded
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const collateralParam = params.get('collateral');
        console.log('Mint page - URL collateral param:', collateralParam);
        console.log('Current window.location.search:', window.location.search);
        if (collateralParam && collateralParam.length === 42 && collateralParam.startsWith('0x')) {
          console.log('Setting collateral token to:', collateralParam);
          setCollateralToken(collateralParam as `0x${string}`);
          setIsAutoFilled(true);
        }
        
        // Also get token name and symbol from URL params
        const tokenNameParam = params.get('tokenName');
        const tokenSymbolParam = params.get('tokenSymbol');
        if (tokenNameParam || tokenSymbolParam) {
          setHasLaunchContext(true);
        }
        if (tokenNameParam) {
          setLaunchTokenName(tokenNameParam);
        }
        if (tokenSymbolParam) {
          setLaunchTokenSymbol(tokenSymbolParam);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  // Debug transaction state
  console.log("Transaction state:", {
    hash,
    isPending,
    isConfirming,
    isSuccess,
    writeError,
    receiptError,
    step
  });

  // Check authentication status (no redirects)
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
          setAuthState(prev => prev + 1); // Force re-render
        },
        onError: (error) => {
          console.error("Error signing message:", error);
        },
      }
    );
  };

  // Read collateral token info (only when authenticated)
  const { data: tokenName } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "name",
    query: {
      enabled: isAuthenticated && collateralToken && collateralToken !== "0x" && collateralToken.length === 42,
    },
  });

  const { data: tokenSymbol } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "symbol",
    query: {
      enabled: isAuthenticated && collateralToken && collateralToken !== "0x" && collateralToken.length === 42,
    },
  });

  const { data: tokenDecimals } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "decimals",
    query: {
      enabled: isAuthenticated && collateralToken && collateralToken !== "0x" && collateralToken.length === 42,
    },
  });

  const { data: balance } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled:
        isAuthenticated && !!address && collateralToken && collateralToken !== "0x" && collateralToken.length === 42,
    },
  });

  const { data: allowance } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "allowance",
    args: [address as `0x${string}`, contractAddresses.CollateralManager],
    query: {
      enabled:
        isAuthenticated && !!address && collateralToken && collateralToken !== "0x" && collateralToken.length === 42,
    },
  });

  // Type-safe variables
  const safeTokenName = typeof tokenName === 'string' ? tokenName : '';
  const safeTokenSymbol = typeof tokenSymbol === 'string' ? tokenSymbol : '';

  const handleApprove = async () => {
    if (!collateralToken || !amount || !tokenDecimals) return;

    try {
      const amountInWei = parseUnits(amount, tokenDecimals as number);
      writeContract({
        address: collateralToken,
        abi: abis.MockERC20,
        functionName: "approve",
        args: [contractAddresses.CollateralManager, amountInWei],
      });
      setStep("approve");
    } catch (error) {
      console.error("Error approving:", error);
    }
  };

  const handleMint = async () => {
    console.log("handleMint called");
    console.log("collateralToken:", collateralToken);
    console.log("amount:", amount);
    console.log("address:", address);
    console.log("tokenDecimals:", tokenDecimals);
    
    const isValidCollateralToken = collateralToken && collateralToken.length === 42 && collateralToken !== "0x";
    
    if (!isValidCollateralToken || !amount || !address || !tokenDecimals) {
      console.log("Missing required fields for minting", {
        isValidCollateralToken,
        hasAmount: !!amount,
        hasAddress: !!address,
        hasTokenDecimals: !!tokenDecimals
      });
      return;
    }

    try {
      const amountInWei = parseUnits(amount, tokenDecimals as number);
      console.log("amountInWei:", amountInWei);
      console.log("Generating ZK proof for deposit...");
      
      // Generate ZK proof for the deposit
      const zkProof = await generateDepositProof(amountInWei);
      console.log("ZK proof generated:", zkProof);
      console.log("Commitment as hex:", "0x" + zkProof.commitment.toString(16));
      console.log("Commitment hex length:", zkProof.commitment.toString(16).length);
      console.log("Nullifier as hex:", "0x" + zkProof.nullifier.toString(16));
      console.log("Nullifier hex length:", zkProof.nullifier.toString(16).length);

      // Encrypted note placeholder (in production, this would contain encrypted transaction details)
      // encryptedNote is type `bytes` (dynamic), so it should be a hex string starting with 0x
      const encryptedNote = ("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')) as `0x${string}`;

      // Convert BigInt values to hex string format for bytes32 (viem expects hex strings for bytes32)
      const commitmentHex = ("0x" + zkProof.commitment.toString(16).padStart(64, '0')) as `0x${string}`;
      const nullifierHex = ("0x" + zkProof.nullifier.toString(16).padStart(64, '0')) as `0x${string}`;

      console.log("Calling writeContract with zkERC20 deposit function");
      console.log("Using commitmentHex:", commitmentHex);
      console.log("Using nullifierHex:", nullifierHex);

      writeContract({
        address: contractAddresses.zkERC20,
        abi: abis.zkERC20,
        functionName: "deposit",
        args: [
          amountInWei, // amount
          commitmentHex, // commitment as hex string
          nullifierHex, // nullifierHash as hex string
          encryptedNote, // encryptedNote
          zkProof.a, // proof.a
          zkProof.b, // proof.b
          zkProof.c, // proof.c
        ],
      }, {
        onSuccess: (hash) => {
          console.log("Transaction submitted successfully:", hash);
          setStep("mint");
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          console.error("Error details:", {
            message: error.message,
            cause: error.cause,
            name: error.name
          });

          // Check if it's a revert error
          if (error.message?.includes('execution reverted') || error.message?.includes('InvalidProof')) {
            console.error("⚠️ Transaction reverted - This is likely due to:");
            console.error("1. Mock ZK proofs not passing verifier validation");
            console.error("2. Need to compile actual circuits and generate real proofs");
            console.error("3. Or the collateral approval might have failed/expired");
            alert("Transaction failed: The ZK proof verification failed. This is expected with mock proofs. You need to either:\n\n1. Compile the circuits and generate real proofs using snarkjs\n2. Deploy contracts with proof verification disabled for testing\n3. Check that collateral token approval is still valid");
          }
        }
      });
    } catch (error) {
      console.error("Error minting:", error);
    }
  };

  useEffect(() => {
    if (isSuccess && step === "approve") {
      setStep("input");
    } else if (isSuccess && step === "mint") {
      setStep("success");
    }
  }, [isSuccess, step]);

  const needsApproval =
    allowance !== undefined &&
    amount !== "" &&
    tokenDecimals !== undefined &&
    parseUnits(amount, tokenDecimals as number) > (allowance as bigint);

  // Calculate progress percentage
  const getProgressPercentage = () => {
    switch (step) {
      case "input":
        return 25;
      case "approve":
        return 50;
      case "mint":
        return 75;
      case "success":
        return 100;
      default:
        return 0;
    }
  };

  const steps = [
    {
      id: "input",
      title: "Enter Details",
      description: "Input token and amount",
    },
    {
      id: "approve",
      title: "Approve Tokens",
      description: "Approve collateral spending",
    },
    {
      id: "mint",
      title: "Mint Tokens",
      description: "Create confidential tokens",
    },
    { id: "success", title: "Complete", description: "Minting successful" },
  ];

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="mx-auto px-4 py-8 container">
        {/* Navigation */}
        <Navigation />

        {/* Header Section with enhanced styling */}
        <div className="mx-auto mb-8 max-w-6xl">
          <div className="mb-8 text-center">
            <Badge variant="gaming" className="mb-4">
              <Coins className="mr-2 w-4 h-4" />
              Confidential Minting Protocol
            </Badge>
            <h1 className="mb-4 font-display font-bold text-5xl">
              <span className="text-yellow-accent">Mint</span> Confidential
              Tokens
            </h1>
            <p className="mx-auto max-w-3xl text-muted-foreground text-xl">
              Transform your ERC20 tokens into confidential assets with
              zero-knowledge privacy guarantees
            </p>
          </div>

          {/* Progress Steps - Enhanced visual design */}
          <GamingCard className="mb-8 p-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white text-xl">
                  Minting Progress
                </h3>
                <div className="flex items-center gap-2">
                  <span className="font-numbers font-bold text-yellow-accent text-2xl">
                    {getProgressPercentage()}%
                  </span>
                  <span className="text-muted-foreground">Complete</span>
                </div>
              </div>

              <Progress
                value={getProgressPercentage()}
                className="w-full h-3"
              />

              <div className="gap-6 grid grid-cols-2 md:grid-cols-4 mt-8">
                {steps.map((stepItem, index) => (
                  <div
                    key={stepItem.id}
                    className={`relative text-center transform transition-all duration-300 ${
                      index <= steps.findIndex((s) => s.id === step)
                        ? "opacity-100 scale-105"
                        : "opacity-60 scale-95"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 mx-auto mb-3 flex items-center justify-center text-sm font-numbers font-bold border-2 transition-all duration-300 ${
                        index < steps.findIndex((s) => s.id === step)
                          ? "bg-yellow-accent text-black border-yellow-accent shadow-lg shadow-yellow-accent/30"
                          : index === steps.findIndex((s) => s.id === step)
                          ? "bg-yellow-accent text-black border-yellow-accent shadow-lg shadow-yellow-accent/30 animate-pulse"
                          : "bg-muted/20 text-muted-foreground border-muted"
                      }`}
                      style={{
                        clipPath:
                          "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
                      }}
                    >
                      {index < steps.findIndex((s) => s.id === step) ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="font-numbers">{index + 1}</span>
                      )}
                    </div>
                    <div className="font-medium text-white text-sm">
                      {stepItem.title}
                    </div>
                    <div className="mt-1 text-muted-foreground text-xs">
                      {stepItem.description}
                    </div>

                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block top-6 left-full -z-10 absolute bg-linear-to-r from-yellow-accent/30 to-muted/30 w-full h-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </GamingCard>
        </div>

        {/* Launch Context Section */}
        {hasLaunchContext && (
          <div className="mx-auto mb-8 max-w-6xl">
            <GamingCard className="bg-green-500/10 border border-green-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="font-semibold text-white text-lg">
                    Launched Token Context
                  </h3>
                  <p className="text-green-300 text-sm">
                    You came from the launch page with the following token configuration
                  </p>
                </div>
              </div>
              
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                {launchTokenName && (
                  <div className="bg-green-400/10 p-3 border border-green-400/30 corner-cut">
                    <div className="text-green-300 text-xs uppercase tracking-wide">
                      Token Name
                    </div>
                    <div className="font-semibold text-white">
                      {launchTokenName}
                    </div>
                  </div>
                )}
                
                {launchTokenSymbol && (
                  <div className="bg-green-400/10 p-3 border border-green-400/30 corner-cut">
                    <div className="text-green-300 text-xs uppercase tracking-wide">
                      Token Symbol
                    </div>
                    <div className="font-semibold text-white">
                      {launchTokenSymbol}
                    </div>
                  </div>
                )}
              </div>
              
              {!isAutoFilled && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 corner-cut mt-4 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-400 text-sm">
                        No Collateral Configuration
                      </p>
                      <p className="mt-1 text-yellow-300 text-sm">
                        This token was launched without collateral backing. For non-collateral tokens, you'll need to:
                      </p>
                      <ul className="mt-2 space-y-1 text-yellow-300 text-sm list-disc list-inside">
                        <li>Manually enter a collateral token address below</li>
                        <li>Or use this page to mint from a different collateral-backed token</li>
                        <li>Or explore other minting strategies for your specific use case</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </GamingCard>
          </div>
        )}

        {/* Main Content with improved layout */}
        <div className="mx-auto max-w-6xl">
          {step === "success" ? (
            <div className="mx-auto max-w-2xl">
              <GamingCard
                variant="action"
                glowColor="green"
                className="space-y-8 p-8 text-center"
              >
                <div className="flex justify-center items-center bg-green-500/20 mx-auto border-2 border-green-400/30 w-20 h-20">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>

                <div>
                  <h2 className="mb-3 font-display font-bold text-white text-3xl">
                    Minting Successful!
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Your confidential tokens have been minted and are ready for
                    private transactions
                  </p>
                </div>

                {/* Enhanced Transaction Details */}
                {hash && (
                  <GamingCard className="space-y-4 bg-muted/20 p-6">
                    <h3 className="mb-4 font-semibold text-white text-lg">
                      Transaction Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Transaction Hash:
                        </span>
                        <span className="bg-yellow-accent/10 px-2 py-1 rounded font-mono text-yellow-accent">
                          {hash.slice(0, 10)}...{hash.slice(-8)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Amount Minted:
                        </span>
                        <span className="font-bold text-white">
                          <span className="font-numbers text-xl">{amount}</span>{" "}
                          {tokenSymbol as string}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Token Contract:
                        </span>
                        <span className="font-mono text-blue-400">
                          {tokenName as string}
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
                    onClick={() => {
                      setStep("input");
                      setAmount("");
                      setCollateralToken("0x");
                    }}
                    className="flex-1 h-12"
                    size="lg"
                  >
                    <Coins className="mr-2 w-4 h-4" />
                    Mint More Tokens
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    size="lg"
                    onClick={() => router.push("/launch")}
                  >
                    <ArrowRight className="mr-2 w-4 h-4" />
                    Launch New Token
                  </Button>
                </div>
              </GamingCard>
            </div>
          ) : (
            <div className="gap-10 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-7">
              {/* Left Panel - Token Selection & Info */}
              <div className="space-y-8 lg:col-span-1 xl:col-span-3">
                <GamingCard className="p-8">
                  <h3 className="flex items-center gap-2 mb-6 font-semibold text-white text-xl">
                    <Coins className="w-5 h-5 text-yellow-accent" />
                    Token Selection
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block mb-2 font-semibold text-white text-sm">
                        Collateral Token Address
                      </label>
                      <Input
                        type="text"
                        value={collateralToken}
                        onChange={(e) => {
                          setCollateralToken(e.target.value as `0x${string}`);
                          setIsAutoFilled(false); // Clear auto-fill flag when user manually changes
                        }}
                        placeholder="0x... (Enter ERC20 token address)"
                        className={`bg-input border-border focus:border-yellow-accent corner-cut ${
                          isAutoFilled ? 'border-blue-400' : ''
                        }`}
                      />
                      {isAutoFilled && (
                        <div className="bg-blue-500/10 border border-blue-500/30 corner-cut p-3 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                            <span className="font-medium text-blue-400 text-sm">
                              Auto-filled from Launch Configuration
                            </span>
                          </div>
                          {(launchTokenName || launchTokenSymbol) && (
                            <div className="text-xs text-blue-300">
                              From token: {launchTokenName} ({launchTokenSymbol})
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {safeTokenName && (
                      <div className="bg-yellow-accent/10 p-4 border border-yellow-accent/30 corner-cut">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-yellow-accent" />
                          <span className="font-medium text-yellow-accent text-sm">
                            Token Verified
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium text-white">
                              {safeTokenName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Symbol:
                            </span>
                            <span className="font-medium text-white">
                              {safeTokenSymbol}
                            </span>
                          </div>
                          {balance !== undefined &&
                            tokenDecimals !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Your Balance:
                                </span>
                                <span className="font-numbers text-white">
                                  {formatUnits(
                                    balance as bigint,
                                    tokenDecimals as number
                                  )}{" "}
                                  {safeTokenSymbol}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </GamingCard>

                {/* Info Panel */}
                <GamingCard className="p-8">
                  <h3 className="flex items-center gap-2 mb-6 font-semibold text-white text-xl">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                    How It Works
                  </h3>
                  <div className="space-y-4 text-muted-foreground text-sm">
                    <div className="flex gap-3">
                      <div className="flex shrink-0 justify-center items-center bg-yellow-accent/20 mt-0.5 w-6 h-6">
                        <span className="font-numbers font-bold text-yellow-accent text-xs">
                          1
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Deposit Collateral
                        </p>
                        <p>
                          Your ERC20 tokens are locked securely in the
                          CollateralManager contract
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex shrink-0 justify-center items-center bg-yellow-accent/20 mt-0.5 w-6 h-6">
                        <span className="font-numbers font-bold text-yellow-accent text-xs">
                          2
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Generate Proof</p>
                        <p>
                          Zero-knowledge proofs ensure your privacy while
                          maintaining verifiability
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex shrink-0 justify-center items-center bg-yellow-accent/20 mt-0.5 w-6 h-6">
                        <span className="font-numbers font-bold text-yellow-accent text-xs">
                          3
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Receive Confidential Tokens
                        </p>
                        <p>
                          1:1 ratio with your collateral, ready for private
                          transactions
                        </p>
                      </div>
                    </div>
                  </div>
                </GamingCard>
              </div>

              {/* Right Panel - Transaction Interface */}
              <div className="lg:col-span-1 xl:col-span-4">
                <GamingCard className="space-y-8 p-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-semibold text-white text-2xl">
                      Mint Configuration
                    </h3>
                    {safeTokenSymbol && (
                      <Badge variant="gaming">
                        {safeTokenSymbol}
                      </Badge>
                    )}
                  </div>

                  {/* Amount Input Section */}
                  <div className="space-y-6">
                    <label className="block font-semibold text-white text-lg">
                      Amount to Mint
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
                      {safeTokenSymbol && (
                        <div className="top-1/2 right-3 absolute font-medium text-muted-foreground text-sm -translate-y-1/2">
                          {safeTokenSymbol}
                        </div>
                      )}
                    </div>

                    {isAuthenticated && balance !== undefined && tokenDecimals !== undefined ? (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Available:{" "}
                          <span className="font-numbers text-white">
                            {formatUnits(
                              balance as bigint,
                              tokenDecimals as number
                            )}
                          </span>{" "}
                          {tokenSymbol as string}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-yellow-accent/10 p-2 h-auto text-yellow-accent hover:text-yellow-accent/80"
                          onClick={() =>
                            setAmount(
                              formatUnits(
                                balance as bigint,
                                tokenDecimals as number
                              )
                            )
                          }
                        >
                          MAX
                        </Button>
                      </div>
                    ) : !isAuthenticated ? (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Available: <span className="text-muted-foreground">Connect wallet to view balance</span>
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-6 pt-6">
                    {!isAuthenticated ? (
                      <div className="space-y-4">
                        {!isConnected ? (
                          <ConnectButton.Custom>
                            {({ openConnectModal }) => (
                              <Button
                                onClick={openConnectModal}
                                className="w-full h-14 text-lg corner-cut"
                                size="lg"
                              >
                                <Coins className="mr-2 w-5 h-5" />
                                Connect Wallet to Mint
                              </Button>
                            )}
                          </ConnectButton.Custom>
                        ) : (
                          <Button
                            onClick={handleSignMessage}
                            className="w-full h-14 text-lg corner-cut"
                            size="lg"
                          >
                            <CheckCircle className="mr-2 w-5 h-5" />
                            Sign Message to Continue
                          </Button>
                        )}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                          <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-300">
                              <strong>Authentication Required:</strong> Please connect your wallet and sign a message to mint confidential tokens and interact with the blockchain.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {needsApproval && (
                          <Button
                            onClick={handleApprove}
                            disabled={
                              isPending ||
                              isConfirming ||
                              !collateralToken ||
                              !amount
                            }
                            className="w-full h-14 text-lg"
                            size="lg"
                          >
                            {isPending || (isConfirming && step === "approve") ? (
                              <>
                                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                Approving Token Access...
                              </>
                            ) : (
                              <>
                                Approve {tokenSymbol || "Token"} Access
                                <ArrowRight className="ml-2 w-5 h-5" />
                              </>
                            )}
                          </Button>
                        )}

                        <Button
                          onClick={() => {
                            console.log("Mint button clicked");
                            console.log("Button disabled state:", {
                              isPending,
                              isConfirming,
                              collateralToken: !collateralToken,
                              amount: !amount
                            });
                            handleMint();
                          }}
                          disabled={
                            isPending ||
                            isConfirming ||
                            !(collateralToken && collateralToken.length === 42 && collateralToken !== "0x") ||
                            !amount
                          }
                          className="w-full h-14 text-lg"
                          size="lg"
                        >
                          {isPending || (isConfirming && step === "mint") ? (
                            <>
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                              Minting Confidential Tokens...
                            </>
                          ) : (
                            <>
                              <Coins className="mr-2 w-5 h-5" />
                              Mint {amount || "0"} Confidential Tokens
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Transaction Status */}
                  {hash && (step as StepType) !== "success" && (
                    <GamingCard className="bg-muted/20 mt-6 p-6">
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
                            Transaction{" "}
                            {isConfirming ? "Confirming..." : "Submitted"}
                          </p>
                          <p className="font-mono text-muted-foreground text-sm">
                            {hash.slice(0, 20)}...{hash.slice(-20)}
                          </p>
                          {isConfirming && (
                            <p className="mt-1 text-yellow-accent text-xs">
                              Waiting for blockchain confirmation
                            </p>
                          )}
                        </div>
                      </div>
                    </GamingCard>
                  )}
                </GamingCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
