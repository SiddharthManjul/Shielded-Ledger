'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseUnits, formatUnits } from 'viem';
import { abis } from '@/lib/contracts';
import { contractAddresses } from '@/lib/config';
import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-2xl font-bold">Shielded Ledger</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/launch"
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
            >
              Token Launch
            </Link>
            <ConnectButton />
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Mint Confidential Tokens</h1>
            <p className="text-gray-400">Deposit ERC20 tokens as collateral to mint confidential tokens with 1:1 ratio</p>
          </div>

          {step === 'success' ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-green-500/50">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Minting Successful!</h2>
                <p className="text-gray-400">Your confidential tokens have been minted</p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setStep('input');
                      setAmount('');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                  >
                    Mint More
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10 space-y-6">
              {/* Collateral Token Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Collateral Token Address</label>
                <input
                  type="text"
                  value={collateralToken}
                  onChange={(e) => setCollateralToken(e.target.value as `0x${string}`)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                />
                {tokenName && (
                  <p className="text-sm text-gray-400 mt-2">
                    Token: {tokenName as string} ({tokenSymbol as string})
                  </p>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    step="any"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                  />
                  {tokenSymbol && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {tokenSymbol as string}
                    </span>
                  )}
                </div>
                {balance !== undefined && tokenDecimals !== undefined && (
                  <p className="text-sm text-gray-400 mt-2">
                    Balance: {formatUnits(balance as bigint, tokenDecimals as number)} {tokenSymbol as string}
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-purple-300">
                  <strong>Note:</strong> Your collateral will be locked in the CollateralManager contract.
                  You will receive confidential tokens that can be transferred privately using zero-knowledge proofs.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {needsApproval && (
                  <button
                    onClick={handleApprove}
                    disabled={isPending || isConfirming || !collateralToken || !amount}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending || (isConfirming && step === 'approve')
                      ? 'Approving...'
                      : `Approve ${tokenSymbol || 'Token'}`}
                  </button>
                )}

                <button
                  onClick={handleMint}
                  disabled={isPending || isConfirming || !collateralToken || !amount || needsApproval}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending || (isConfirming && step === 'mint')
                    ? 'Minting...'
                    : 'Mint Confidential Tokens'}
                </button>
              </div>

              {/* Transaction Status */}
              {hash && (
                <div className="bg-white/5 rounded-lg p-4 text-sm">
                  <p className="text-gray-400">Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}</p>
                  {isConfirming && <p className="text-yellow-400 mt-1">Waiting for confirmation...</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
