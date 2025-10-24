'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';
import { parseUnits } from 'viem';
import { Rocket, CheckCircle, Settings, Info, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/navigation';
import { GamingCard } from '@/components/ui/gaming-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { abis } from '@/lib/contracts';
import { contractAddresses } from '@/lib/config';

export default function LaunchPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [initialSupply, setInitialSupply] = useState('');
  const [hasCollateral, setHasCollateral] = useState(false);
  const [collateralToken, setCollateralToken] = useState<`0x${string}`>('0x');
  const [step, setStep] = useState<'input' | 'deploying' | 'success'>('input');
  const [deployedAddress, setDeployedAddress] = useState<`0x${string}` | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check authentication
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    const authStatus = localStorage.getItem('shielded-ledger-auth');
    if (authStatus !== address) {
      router.push('/');
    }
  }, [isConnected, address, router]);

  // Read collateral token info if selected
  const { data: collateralTokenName } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: 'name',
    query: { enabled: hasCollateral && collateralToken !== '0x' && collateralToken.length === 42 },
  });

  const { data: collateralTokenSymbol } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: 'symbol',
    query: { enabled: hasCollateral && collateralToken !== '0x' && collateralToken.length === 42 },
  });

  const handleLaunch = async () => {
    if (!tokenName || !tokenSymbol || !address) return;

    try {
      const supplyInWei = initialSupply ? parseUnits(initialSupply, 18) : 0n;

      // Note: This is a simplified version. In production, you would need:
      // 1. Deploy zkERC20 contract with proper constructor args
      // 2. If hasCollateral, register with CollateralManager
      // 3. Deploy verifier contracts if not already deployed

      // For now, we're assuming there's a factory contract or similar
      // This is a placeholder - actual implementation depends on your deployment strategy
      writeContract({
        address: contractAddresses.zkERC20, // This would actually be a factory address
        abi: abis.zkERC20,
        functionName: 'initialize', // Placeholder - depends on actual contract design
        args: [tokenName, tokenSymbol, supplyInWei],
      });

      setStep('deploying');
    } catch (error) {
      console.error('Error launching token:', error);
    }
  };

  useEffect(() => {
    if (isSuccess && step === 'deploying') {
      setStep('success');
      // In production, you'd extract the deployed address from the transaction receipt
      // setDeployedAddress(extractedAddress);
    }
  }, [isSuccess, step]);

  const canLaunch = tokenName && tokenSymbol && (!hasCollateral || (collateralToken && collateralToken !== '0x'));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <Navigation />

        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 mb-4">
            <Rocket className="w-4 h-4 mr-2" />
            Token Launch Platform
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-blue-400">Launch</span> Confidential Token
          </h1>
          <p className="text-muted-foreground text-lg">
            Create an entirely new confidential ERC20 token with built-in privacy features
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">

          {step === 'success' ? (
            <GamingCard variant="action" glowColor="green">
              <div className="text-center space-y-6 p-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Token Launched Successfully!</h2>
                  <p className="text-muted-foreground">Your confidential token has been deployed and is ready for use</p>
                </div>
                
                {/* Token Details */}
                <GamingCard className="bg-muted/20 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Token Name:</span>
                      <span className="font-semibold text-white">{tokenName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Symbol:</span>
                      <span className="font-semibold text-white">{tokenSymbol}</span>
                    </div>
                    {deployedAddress && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Address:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-yellow-accent text-xs">{deployedAddress.slice(0, 10)}...{deployedAddress.slice(-8)}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {hash && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Transaction:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-400 text-xs">{hash.slice(0, 10)}...{hash.slice(-8)}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </GamingCard>

                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setStep('input');
                      setTokenName('');
                      setTokenSymbol('');
                      setInitialSupply('');
                      setHasCollateral(false);
                      setCollateralToken('0x');
                    }}
                    className="flex-1 glow-button bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Launch Another Token
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-border hover:bg-hover-bg"
                    onClick={() => router.push('/mint')}
                  >
                    Go to Minting
                  </Button>
                </div>
              </div>
            </GamingCard>
          ) : (
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-card">
                <TabsTrigger value="basic" className="data-[state=active]:bg-yellow-accent data-[state=active]:text-black">
                  <Settings className="w-4 h-4 mr-2" />
                  Basic Setup
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-yellow-accent data-[state=active]:text-black">
                  <Info className="w-4 h-4 mr-2" />
                  Advanced Options
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <GamingCard className="p-8 space-y-6">
                  {/* Token Name */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white">Token Name</label>
                    <Input
                      type="text"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="e.g., Private Dollar"
                      className="bg-input border-border focus:border-blue-400"
                    />
                    <p className="text-xs text-muted-foreground">The full name of your token</p>
                  </div>

                  {/* Token Symbol */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white">Token Symbol</label>
                    <Input
                      type="text"
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g., PUSD"
                      maxLength={10}
                      className="bg-input border-border focus:border-blue-400"
                    />
                    <p className="text-xs text-muted-foreground">Short identifier (2-10 characters)</p>
                  </div>

                  {/* Initial Supply */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white">Initial Supply (Optional)</label>
                    <Input
                      type="number"
                      value={initialSupply}
                      onChange={(e) => setInitialSupply(e.target.value)}
                      placeholder="0"
                      step="any"
                      className="bg-input border-border focus:border-blue-400"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for 0 initial supply. Can be minted later if collateral-backed.</p>
                  </div>

                  {/* Token Preview */}
                  {tokenName && tokenSymbol && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-400 mb-3">Token Preview</p>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-white text-lg">
                          {tokenSymbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{tokenName}</p>
                          <p className="text-sm text-muted-foreground">{tokenSymbol}</p>
                          <p className="text-xs text-blue-400">Confidential ERC20 Token</p>
                        </div>
                      </div>
                    </div>
                  )}
                </GamingCard>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <GamingCard className="p-8 space-y-6">
                  {/* Collateral Backing */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">Collateral-Backed Token</p>
                        <p className="text-sm text-muted-foreground">Require ERC20 collateral for minting (recommended for stablecoins)</p>
                      </div>
                      <Button
                        variant={hasCollateral ? "default" : "outline"}
                        onClick={() => setHasCollateral(!hasCollateral)}
                        className={hasCollateral ? "bg-yellow-accent text-black" : ""}
                      >
                        {hasCollateral ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    {hasCollateral && (
                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-white">Collateral Token Address</label>
                          <Input
                            type="text"
                            value={collateralToken}
                            onChange={(e) => setCollateralToken(e.target.value as `0x${string}`)}
                            placeholder="0x... (ERC20 token address)"
                            className="bg-input border-border focus:border-blue-400"
                          />
                          {collateralTokenName && (
                            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-blue-400" />
                              <span className="text-sm">
                                Collateral: <strong>{collateralTokenName as string}</strong> ({collateralTokenSymbol as string})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Sections */}
                  <div className="space-y-4">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-purple-300">
                          <strong>Privacy Features:</strong> All token transfers will be shielded using zero-knowledge proofs.
                          Transaction amounts and recipient addresses will be completely private.
                        </div>
                      </div>
                    </div>

                    {hasCollateral && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-300">
                            <strong>Collateral Backing:</strong> Users will need to lock the specified ERC20 token as collateral
                            to mint your confidential token at a 1:1 ratio. This ensures backing and redeemability.
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">Ready to Launch?</h3>
                      <p className="text-sm text-muted-foreground">Deploy your confidential token to the blockchain</p>
                    </div>
                    <Badge className={canLaunch ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                      {canLaunch ? 'Ready' : 'Incomplete'}
                    </Badge>
                  </div>

                  <Button
                    onClick={handleLaunch}
                    disabled={!canLaunch || isPending || isConfirming}
                    className="w-full h-12 glow-button bg-blue-500 text-white hover:bg-blue-600 font-semibold"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Launching Token...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Launch Token
                      </>
                    )}
                  </Button>

                  {/* Transaction Status */}
                  {hash && (
                    <GamingCard className="bg-muted/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          {isConfirming ? (
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            Transaction {isConfirming ? 'confirming' : 'submitted'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
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
