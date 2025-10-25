"use client";

import { Navigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GamingCard } from "@/components/ui/gaming-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contractAddresses } from "@/lib/config";
import { abis } from "@/lib/contracts";
import {
  AlertCircle,
  CheckCircle,
  Coins,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Rocket,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { parseUnits, formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
  useSignMessage,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function LaunchPage() {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const router = useRouter();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [initialSupply, setInitialSupply] = useState("");
  const [hasCollateral, setHasCollateral] = useState(false);
  const [collateralToken, setCollateralToken] = useState<`0x${string}`>("0x");
  const [step, setStep] = useState<"input" | "deploying" | "success">("input");
  const [deployedAddress, setDeployedAddress] = useState<`0x${string}` | null>(null);
  const [, setAuthState] = useState(0); // Force re-render trigger
  
  // Quick mint state
  const [quickMintAmount, setQuickMintAmount] = useState("");
  const [isQuickMinting, setIsQuickMinting] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check authentication status (no redirects)
  const isAuthenticated = isConnected && localStorage.getItem("shielded-ledger-auth") === address;
  
  // Read collateral token info for quick mint (only when authenticated and collateral is set)
  const { data: quickCollateralTokenName } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "name",
    query: {
      enabled:
        isAuthenticated &&
        hasCollateral &&
        collateralToken !== "0x" &&
        collateralToken.length === 42,
    },
  });

  const { data: quickCollateralTokenSymbol } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "symbol",
    query: {
      enabled:
        isAuthenticated &&
        hasCollateral &&
        collateralToken !== "0x" &&
        collateralToken.length === 42,
    },
  });

  const { data: collateralTokenDecimals } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "decimals",
    query: {
      enabled:
        isAuthenticated &&
        hasCollateral &&
        collateralToken !== "0x" &&
        collateralToken.length === 42,
    },
  });

  const { data: collateralBalance } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled:
        isAuthenticated &&
        !!address &&
        hasCollateral &&
        collateralToken !== "0x" &&
        collateralToken.length === 42,
    },
  });

  const { data: collateralAllowance } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "allowance",
    args: [address as `0x${string}`, contractAddresses.CollateralManager],
    query: {
      enabled:
        isAuthenticated &&
        !!address &&
        hasCollateral &&
        collateralToken !== "0x" &&
        collateralToken.length === 42,
    },
  });

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

  // Read collateral token info if selected (only when authenticated)
  const { data: collateralTokenName } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "name",
    query: {
      enabled:
        isAuthenticated &&
        hasCollateral &&
        collateralToken !== "0x" &&
        collateralToken.length === 42,
    },
  });

  const { data: collateralTokenSymbol } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: "symbol",
    query: {
      enabled:
        isAuthenticated &&
        hasCollateral &&
        collateralToken !== "0x" &&
        collateralToken.length === 42,
    },
  });

  // Type-safe variables
  const safeCollateralTokenName = typeof collateralTokenName === 'string' ? collateralTokenName : '';
  const safeCollateralTokenSymbol = typeof collateralTokenSymbol === 'string' ? collateralTokenSymbol : '';
  
  // Quick mint type-safe variables
  const safeQuickCollateralTokenName = typeof quickCollateralTokenName === 'string' ? quickCollateralTokenName : '';
  const safeQuickCollateralTokenSymbol = typeof quickCollateralTokenSymbol === 'string' ? quickCollateralTokenSymbol : '';

  const handleLaunch = async () => {
    if (!tokenName || !tokenSymbol || !address) return;

    try {
      // Since we're using the existing zkERC20 contract, we'll demonstrate
      // with a simple deposit operation to show interaction with the contract
      // In a real implementation, you might want to:
      // 1. Register as a user
      // 2. Get a stealth address
      // 3. Perform initial deposit
      
      // For demonstration, we'll call getMerkleRoot to test contract interaction
      writeContract({
        address: contractAddresses.zkERC20,
        abi: abis.zkERC20,
        functionName: "getMerkleRoot",
        args: [],
      });

      setStep("deploying");
    } catch (error) {
      console.error("Error interacting with contract:", error);
    }
  };

  useEffect(() => {
    if (isSuccess && step === "deploying") {
      setStep("success");
      // In production, you'd extract the deployed address from the transaction receipt
      // setDeployedAddress(extractedAddress);
    }
    if (isSuccess && isQuickMinting) {
      setIsQuickMinting(false);
      setQuickMintAmount("");
    }
  }, [isSuccess, step, isQuickMinting]);
  
  const handleQuickMint = async () => {
    if (!collateralToken || !quickMintAmount || !address || !collateralTokenDecimals) return;

    try {
      setIsQuickMinting(true);
      const amountInWei = parseUnits(quickMintAmount, collateralTokenDecimals as number);
      
      // Check if approval is needed
      const needsApproval = collateralAllowance !== undefined &&
        quickMintAmount !== "" &&
        collateralTokenDecimals !== undefined &&
        amountInWei > (collateralAllowance as bigint);
      
      if (needsApproval) {
        // First approve
        writeContract({
          address: collateralToken,
          abi: abis.MockERC20,
          functionName: "approve",
          args: [contractAddresses.CollateralManager, amountInWei],
        });
      } else {
        // Direct mint with placeholder ZK proof
        writeContract({
          address: contractAddresses.zkERC20,
          abi: abis.zkERC20,
          functionName: "deposit",
          args: [
            amountInWei,
            BigInt(0), // commitment (placeholder)
            BigInt(0), // nullifierHash (placeholder)
            "0x", // encryptedNote (placeholder)
            [BigInt(0), BigInt(0)], // proof.a (placeholder)
            [
              [BigInt(0), BigInt(0)],
              [BigInt(0), BigInt(0)],
            ], // proof.b (placeholder)
            [BigInt(0), BigInt(0)], // proof.c (placeholder)
          ],
        });
      }
    } catch (error) {
      console.error("Error in quick mint:", error);
      setIsQuickMinting(false);
    }
  };
  
  const needsQuickApproval =
    collateralAllowance !== undefined &&
    quickMintAmount !== "" &&
    collateralTokenDecimals !== undefined &&
    parseUnits(quickMintAmount, collateralTokenDecimals as number) > (collateralAllowance as bigint);

  const canLaunch =
    tokenName &&
    tokenSymbol &&
    (!hasCollateral || (collateralToken && collateralToken !== "0x"));

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="mx-auto px-4 py-8 container">
        {/* Navigation */}
        <Navigation />

        {/* Header */}
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <Badge variant="gaming-blue" className="mb-4">
            <Rocket className="mr-2 w-4 h-4" />
            Token Launch Platform
          </Badge>
          <h1 className="mb-4 font-display font-bold text-4xl">
            <span className="text-blue-400">Interact</span> with zkERC20
          </h1>
          <p className="text-muted-foreground text-lg">
            Test interaction with the deployed confidential ERC20 token
          </p>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-4xl">
          {step === "success" ? (
            <GamingCard variant="action" glowColor="green">
              <div className="space-y-6 p-6 text-center">
                <div className="flex justify-center items-center bg-green-500/20 mx-auto w-16 h-16">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h2 className="mb-2 font-bold text-white text-2xl">
                    Contract Interaction Successful!
                  </h2>
                  <p className="text-muted-foreground">
                    Successfully interacted with the zkERC20 contract
                  </p>
                </div>

                {/* Token Details */}
                <GamingCard className="bg-muted/20 p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Token Name:</span>
                      <span className="font-semibold text-white">
                        {tokenName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Symbol:</span>
                      <span className="font-semibold text-white">
                        {tokenSymbol}
                      </span>
                    </div>
                    {deployedAddress && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Address:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-yellow-accent text-xs">
                            {deployedAddress.slice(0, 10)}...
                            {deployedAddress.slice(-8)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-0 w-6 h-6"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {hash && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Transaction:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-400 text-xs">
                            {hash.slice(0, 10)}...{hash.slice(-8)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-0 w-6 h-6"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </GamingCard>

                {/* Quick Mint Section */}
                {hasCollateral && collateralToken !== "0x" && isAuthenticated && (
                  <GamingCard className="bg-blue-500/10 border border-blue-500/30 p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold text-white text-lg">
                          Quick Mint Tokens
                        </h3>
                        {safeQuickCollateralTokenSymbol && (
                          <Badge variant="gaming-blue">
                            {safeQuickCollateralTokenSymbol}
                          </Badge>
                        )}
                      </div>
                      
                      {safeQuickCollateralTokenName && (
                        <div className="bg-blue-400/10 p-3 border border-blue-400/30 corner-cut">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                            <span className="font-medium text-blue-400 text-sm">
                              Using Collateral: {safeQuickCollateralTokenName}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <label className="block font-semibold text-white text-sm">
                          Amount to Mint
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={quickMintAmount}
                            onChange={(e) => setQuickMintAmount(e.target.value)}
                            placeholder="0.0"
                            step="any"
                            className="bg-input pr-16 border-border focus:border-blue-400 corner-cut"
                          />
                          {safeQuickCollateralTokenSymbol && (
                            <div className="top-1/2 right-3 absolute font-medium text-muted-foreground text-sm -translate-y-1/2">
                              {safeQuickCollateralTokenSymbol}
                            </div>
                          )}
                        </div>
                        
                        {collateralBalance !== undefined && collateralTokenDecimals !== undefined && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              Available:{" "}
                              <span className="font-numbers text-white">
                                {formatUnits(
                                  collateralBalance as bigint,
                                  collateralTokenDecimals as number
                                )}
                              </span>{" "}
                              {safeQuickCollateralTokenSymbol}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-blue-400/10 p-2 h-auto text-blue-400 hover:text-blue-400/80"
                              onClick={() =>
                                setQuickMintAmount(
                                  formatUnits(
                                    collateralBalance as bigint,
                                    collateralTokenDecimals as number
                                  )
                                )
                              }
                            >
                              MAX
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={handleQuickMint}
                        disabled={
                          isPending ||
                          isConfirming ||
                          !quickMintAmount ||
                          isQuickMinting
                        }
                        className="w-full h-12"
                        variant="info"
                      >
                        {isPending || isConfirming || isQuickMinting ? (
                          <>
                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                            {needsQuickApproval ? "Approving..." : "Minting..."}
                          </>
                        ) : (
                          <>
                            <Coins className="mr-2 w-4 h-4" />
                            {needsQuickApproval
                              ? `Approve & Mint ${quickMintAmount || "0"} Tokens`
                              : `Quick Mint ${quickMintAmount || "0"} Tokens`}
                          </>
                        )}
                      </Button>
                    </div>
                  </GamingCard>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setStep("input");
                      setTokenName("");
                      setTokenSymbol("");
                      setInitialSupply("");
                      setHasCollateral(false);
                      setCollateralToken("0x");
                    }}
                    variant="info"
                    className="flex-1"
                  >
                    Test Another Interaction
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      // Pre-populate mint page with launch configuration
                      const mintParams = new URLSearchParams();
                      
                      // Always pass collateral token if it's been entered (regardless of hasCollateral checkbox)
                      if (collateralToken && collateralToken !== "0x" && collateralToken.length === 42) {
                        mintParams.set('collateral', collateralToken);
                      }
                      
                      // Also pass token name and symbol for reference
                      if (tokenName) {
                        mintParams.set('tokenName', tokenName);
                      }
                      if (tokenSymbol) {
                        mintParams.set('tokenSymbol', tokenSymbol);
                      }
                      
                      const mintUrl = `/mint?${mintParams.toString()}`;
                      console.log('=== LAUNCH TO MINT NAVIGATION ===');
                      console.log('hasCollateral:', hasCollateral);
                      console.log('collateralToken:', collateralToken);
                      console.log('tokenName:', tokenName);
                      console.log('tokenSymbol:', tokenSymbol);
                      console.log('Final URL:', mintUrl);
                      console.log('URL params:', mintParams.toString());
                      
                      router.push(mintUrl);
                    }}
                  >
                    Go to Full Minting
                  </Button>
                </div>
              </div>
            </GamingCard>
          ) : (
            <Tabs defaultValue="basic" className="space-y-8">
              <div className="flex justify-center">
                <TabsList className="grid grid-cols-2 w-fit min-w-[400px]">
                  <TabsTrigger value="basic">
                    <Settings className="w-4 h-4" />
                    Basic Setup
                  </TabsTrigger>
                  <TabsTrigger value="advanced">
                    <Info className="w-4 h-4" />
                    Advanced Options
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="basic" className="space-y-6">
                <GamingCard className="space-y-6 p-8">
                  {/* Token Name */}
                  <div className="space-y-3">
                    <label className="block font-semibold text-white text-sm">
                      Token Name
                    </label>
                    <Input
                      type="text"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="e.g., Private Dollar"
                      className="bg-input border-border focus:border-yellow-accent corner-cut"
                    />
                    <p className="text-muted-foreground text-xs">
                      The full name of your token
                    </p>
                  </div>

                  {/* Token Symbol */}
                  <div className="space-y-3">
                    <label className="block font-semibold text-white text-sm">
                      Token Symbol
                    </label>
                    <Input
                      type="text"
                      value={tokenSymbol}
                      onChange={(e) =>
                        setTokenSymbol(e.target.value.toUpperCase())
                      }
                      placeholder="e.g., PUSD"
                      maxLength={10}
                      className="bg-input border-border focus:border-yellow-accent corner-cut"
                    />
                    <p className="text-muted-foreground text-xs">
                      Short identifier (2-10 characters)
                    </p>
                  </div>

                  {/* Initial Supply */}
                  <div className="space-y-3">
                    <label className="block font-semibold text-white text-sm">
                      Initial Supply (Optional)
                    </label>
                    <Input
                      type="number"
                      value={initialSupply}
                      onChange={(e) => setInitialSupply(e.target.value)}
                      placeholder="0"
                      step="any"
                      className="bg-input border-border focus:border-yellow-accent corner-cut"
                    />
                    <p className="text-muted-foreground text-xs">
                      Leave empty for 0 initial supply. Can be minted later if
                      collateral-backed.
                    </p>
                  </div>

                  {/* Token Preview */}
                  {tokenName && tokenSymbol && (
                    <div className="bg-yellow-accent/10 p-4 border border-yellow-accent/30 corner-cut">
                      <p className="mb-3 font-semibold text-yellow-accent text-sm">
                        Token Preview
                      </p>
                      <div className="flex items-center space-x-3">
                        <div className="flex justify-center items-center bg-linear-to-br from-yellow-accent to-golden w-12 h-12 font-bold text-black text-lg corner-cut">
                          {tokenSymbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {tokenName}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {tokenSymbol}
                          </p>
                          <p className="text-yellow-accent text-xs">
                            Confidential ERC20 Token
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </GamingCard>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <GamingCard className="space-y-6 p-8">
                  {/* Collateral Backing */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white">
                          Collateral-Backed Token
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Require ERC20 collateral for minting (recommended for
                          stablecoins)
                        </p>
                      </div>
                      <Button
                        variant={hasCollateral ? "default" : "outline"}
                        onClick={() => setHasCollateral(!hasCollateral)}
                        className=""
                      >
                        {hasCollateral ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    {hasCollateral && (
                      <div className="space-y-4 pt-4 border-border border-t">
                        <div className="space-y-3">
                          <label className="block font-semibold text-white text-sm">
                            Collateral Token Address
                          </label>
                          <Input
                            type="text"
                            value={collateralToken}
                            onChange={(e) =>
                              setCollateralToken(
                                e.target.value as `0x${string}`
                              )
                            }
                            placeholder="0x... (ERC20 token address)"
                            className="bg-input border-border focus:border-yellow-accent corner-cut"
                          />
                          {safeCollateralTokenName && (
                            <div className="flex items-center gap-2 bg-yellow-accent/10 p-3 border border-yellow-accent/30 corner-cut">
                              <CheckCircle className="w-4 h-4 text-yellow-accent" />
                              <span className="text-sm">
                                Collateral:{" "}
                                <strong>{safeCollateralTokenName}</strong>{" "}
                                ({safeCollateralTokenSymbol})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Sections */}
                  <div className="space-y-4">
                    <div className="bg-purple-500/10 p-4 border border-purple-500/30">
                      <div className="flex gap-3">
                        <AlertCircle className="shrink-0 mt-0.5 w-5 h-5 text-purple-400" />
                        <div className="text-purple-300 text-sm">
                          <strong>Privacy Features:</strong> All token transfers
                          will be shielded using zero-knowledge proofs.
                          Transaction amounts and recipient addresses will be
                          completely private.
                        </div>
                      </div>
                    </div>

                    {hasCollateral && (
                      <div className="bg-blue-500/10 p-4 border border-blue-500/30">
                        <div className="flex gap-3">
                          <Info className="shrink-0 mt-0.5 w-5 h-5 text-blue-400" />
                          <div className="text-blue-300 text-sm">
                            <strong>Collateral Backing:</strong> Users will need
                            to lock the specified ERC20 token as collateral to
                            mint your confidential token at a 1:1 ratio. This
                            ensures backing and redeemability.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </GamingCard>
              </TabsContent>

              {/* Launch Section */}
              <GamingCard className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white">
                        Ready to Interact?
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Test interaction with the zkERC20 contract
                      </p>
                    </div>
                    <Badge
                      variant={canLaunch ? "gaming-green" : "gaming-red"}
                    >
                      {canLaunch ? "Ready" : "Incomplete"}
                    </Badge>
                  </div>

                  {!isAuthenticated ? (
                    <div className="space-y-4">
                      {!isConnected ? (
                        <ConnectButton.Custom>
                          {({ openConnectModal }) => (
                            <Button
                              onClick={openConnectModal}
                              variant="info"
                              className="w-full h-12 corner-cut"
                            >
                              <Rocket className="mr-2 w-4 h-4" />
                              Connect Wallet to Interact
                            </Button>
                          )}
                        </ConnectButton.Custom>
                      ) : (
                        <Button
                          onClick={handleSignMessage}
                          variant="info"
                          className="w-full h-12 corner-cut"
                        >
                          <CheckCircle className="mr-2 w-4 h-4" />
                          Sign Message to Continue
                        </Button>
                      )}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-300">
                            <strong>Authentication Required:</strong> Please connect your wallet and sign a message to launch confidential tokens on the blockchain.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleLaunch}
                      disabled={!canLaunch || isPending || isConfirming}
                      variant="info"
                      className="w-full h-12"
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Interacting...
                        </>
                      ) : (
                        <>
                          <Rocket className="mr-2 w-4 h-4" />
                          Test Interaction
                        </>
                      )}
                    </Button>
                  )}

                  {/* Transaction Status */}
                  {hash && (
                    <GamingCard className="bg-muted/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex justify-center items-center bg-blue-500/20 w-8 h-8">
                          {isConfirming ? (
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">
                            Transaction{" "}
                            {isConfirming ? "confirming" : "submitted"}
                          </p>
                          <p className="font-mono text-muted-foreground text-xs">
                            {hash.slice(0, 10)}...{hash.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </GamingCard>
                  )}
                </div>
              </GamingCard>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
