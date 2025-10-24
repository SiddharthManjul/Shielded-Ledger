'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
import { parseUnits, formatUnits } from 'viem';
import { CheckCircle, Coins, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Navigation } from '@/components/navigation';
import { GamingCard } from '@/components/ui/gaming-card';
import { abis } from '@/lib/contracts';
import { contractAddresses } from '@/lib/config';

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [collateralToken, setCollateralToken] = useState<`0x${string}`>('0x');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'mint' | 'success'>('input');

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

  // Read collateral token info
  const { data: tokenName } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: 'name',
    query: { enabled: collateralToken !== '0x' && collateralToken.length === 42 },
  });

  const { data: tokenSymbol } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: 'symbol',
    query: { enabled: collateralToken !== '0x' && collateralToken.length === 42 },
  });

  const { data: tokenDecimals } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: 'decimals',
    query: { enabled: collateralToken !== '0x' && collateralToken.length === 42 },
  });

  const { data: balance } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address && collateralToken !== '0x' && collateralToken.length === 42 },
  });

  const { data: allowance } = useReadContract({
    address: collateralToken,
    abi: abis.MockERC20,
    functionName: 'allowance',
    args: [address as `0x${string}`, contractAddresses.CollateralManager],
    query: { enabled: !!address && collateralToken !== '0x' && collateralToken.length === 42 },
  });

  const handleApprove = async () => {
    if (!collateralToken || !amount || !tokenDecimals) return;

    try {
      const amountInWei = parseUnits(amount, tokenDecimals as number);
      writeContract({
        address: collateralToken,
        abi: abis.MockERC20,
        functionName: 'approve',
        args: [contractAddresses.CollateralManager, amountInWei],
      });
      setStep('approve');
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleMint = async () => {
    if (!collateralToken || !amount || !address || !tokenDecimals) return;

    try {
      const amountInWei = parseUnits(amount, tokenDecimals as number);
      // Note: In production, you'd need to generate the ZK proof here
      // For now, this is a placeholder that calls the deposit function
      writeContract({
        address: contractAddresses.zkERC20,
        abi: abis.zkERC20,
        functionName: 'deposit',
        args: [
          [0n, 0n], // proof.a (placeholder)
          [[0n, 0n], [0n, 0n]], // proof.b (placeholder)
          [0n, 0n], // proof.c (placeholder)
          0n, // commitment (placeholder)
          amountInWei,
        ],
      });
      setStep('mint');
    } catch (error) {
      console.error('Error minting:', error);
    }
  };

  useEffect(() => {
    if (isSuccess && step === 'approve') {
      setStep('input');
    } else if (isSuccess && step === 'mint') {
      setStep('success');
    }
  }, [isSuccess, step]);

  const needsApproval = allowance !== undefined &&
    amount !== '' &&
    tokenDecimals !== undefined &&
    parseUnits(amount, tokenDecimals as number) > (allowance as bigint);

  // Calculate progress percentage
  const getProgressPercentage = () => {
    switch (step) {
      case 'input': return 25;
      case 'approve': return 50;
      case 'mint': return 75;
      case 'success': return 100;
      default: return 0;
    }
  };

  const steps = [
    { id: 'input', title: 'Enter Details', description: 'Input token and amount' },
    { id: 'approve', title: 'Approve Tokens', description: 'Approve collateral spending' },
    { id: 'mint', title: 'Mint Tokens', description: 'Create confidential tokens' },
    { id: 'success', title: 'Complete', description: 'Minting successful' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <Navigation />

        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <Badge className="bg-yellow-accent/10 text-yellow-accent border-yellow-accent/30 mb-4">
            <Coins className="w-4 h-4 mr-2" />
            Confidential Minting
          </Badge>
          <h1 className="text-4xl font-display font-bold mb-4">
            <span className="text-yellow-accent">Mint</span> Confidential Tokens
          </h1>
          <p className="text-muted-foreground text-lg">
            Deposit ERC20 tokens as collateral to mint confidential tokens with 1:1 ratio
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <GamingCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Minting Progress</h3>
                <span className="text-sm text-muted-foreground"><span className="font-numbers">{getProgressPercentage()}%</span> Complete</span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
              <div className="grid grid-cols-4 gap-4 mt-6">
                {steps.map((stepItem, index) => (
                  <div
                    key={stepItem.id}
                    className={`text-center ${
                      index <= steps.findIndex(s => s.id === step) ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-numbers font-bold ${
                        index < steps.findIndex(s => s.id === step)
                          ? 'bg-yellow-accent text-black'
                          : index === steps.findIndex(s => s.id === step)
                          ? 'bg-yellow-accent text-black'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index < steps.findIndex(s => s.id === step) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="font-numbers">{index + 1}</span>
                      )}
                    </div>
                    <div className="text-xs font-medium">{stepItem.title}</div>
                    <div className="text-xs text-muted-foreground">{stepItem.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </GamingCard>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {step === 'success' ? (
            <GamingCard variant="action" glowColor="green">
              <div className="text-center space-y-6 p-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Minting Successful!</h2>
                  <p className="text-muted-foreground">Your confidential tokens have been minted and are ready for private transactions</p>
                </div>
                
                {/* Transaction Details */}
                {hash && (
                  <GamingCard className="bg-muted/20 p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction:</span>
                        <span className="font-mono text-yellow-accent">{hash.slice(0, 10)}...{hash.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount Minted:</span>
                        <span className="text-white"><span className="font-numbers">{amount}</span> {tokenSymbol as string}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Confirmed
                        </Badge>
                      </div>
                    </div>
                  </GamingCard>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setStep('input');
                      setAmount('');
                      setCollateralToken('0x');
                    }}
                    className="flex-1"
                  >
                    Mint More Tokens
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push('/launch')}
                  >
                    Launch New Token
                  </Button>
                </div>
              </div>
            </GamingCard>
          ) : (
            <GamingCard className="p-8 space-y-6">
              {/* Token Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white">Collateral Token Address</label>
                <Input
                  type="text"
                  value={collateralToken}
                  onChange={(e) => setCollateralToken(e.target.value as `0x${string}`)}
                  placeholder="0x... (Enter ERC20 token address)"
                  className="bg-input border-border focus:border-yellow-accent"
                />
                {tokenName && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-accent/10 border border-yellow-accent/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-yellow-accent" />
                    <span className="text-sm">
                      Token: <strong>{tokenName as string}</strong> ({tokenSymbol as string})
                    </span>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white">Amount to Mint</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    step="any"
                    className="bg-input border-border focus:border-yellow-accent pr-20"
                  />
                  {tokenSymbol && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      {tokenSymbol as string}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  {balance !== undefined && tokenDecimals !== undefined && (
                    <span className="text-muted-foreground">
                      Balance: <span className="font-numbers">{formatUnits(balance as bigint, tokenDecimals as number)}</span> {tokenSymbol as string}
                    </span>
                  )}
                  {balance !== undefined && tokenDecimals !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-yellow-accent hover:text-yellow-accent/80"
                      onClick={() => setAmount(formatUnits(balance as bigint, tokenDecimals as number))}
                    >
                      MAX
                    </Button>
                  )}
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <strong>How it works:</strong> Your collateral will be securely locked in the CollateralManager contract.
                    You'll receive confidential tokens that can be transferred privately using zero-knowledge proofs.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {needsApproval && (
                  <Button
                    onClick={handleApprove}
                    disabled={isPending || isConfirming || !collateralToken || !amount}
                    className="w-full h-12"
                  >
                    {isPending || (isConfirming && step === 'approve') ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        Approve {tokenSymbol || 'Token'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleMint}
                  disabled={isPending || isConfirming || !collateralToken || !amount || needsApproval}
                  className="w-full h-12"
                >
                  {isPending || (isConfirming && step === 'mint') ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 mr-2" />
                      Mint Confidential Tokens
                    </>
                  )}
                </Button>
              </div>

              {/* Transaction Status */}
              {hash && step !== 'success' && (
                <GamingCard className="bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-accent/20 rounded-full flex items-center justify-center">
                      {isConfirming ? (
                        <Loader2 className="w-4 h-4 text-yellow-accent animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-yellow-accent" />
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
            </GamingCard>
          )}
        </div>
      </div>
    </div>
  );
}
