'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseUnits } from 'viem';
import { abis } from '@/lib/contracts';
import { contractAddresses } from '@/lib/config';
import Link from 'next/link';

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
              href="/mint"
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
            >
              Token Minting
            </Link>
            <ConnectButton />
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Launch Confidential Token</h1>
            <p className="text-gray-400">Create an entirely new confidential ERC20 token with built-in privacy</p>
          </div>

          {step === 'success' ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-green-500/50">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Token Launched Successfully!</h2>
                <p className="text-gray-400">Your confidential token has been deployed</p>
                {deployedAddress && (
                  <div className="bg-white/5 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-400 mb-1">Token Address:</p>
                    <p className="font-mono text-purple-400">{deployedAddress}</p>
                  </div>
                )}
                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => {
                      setStep('input');
                      setTokenName('');
                      setTokenSymbol('');
                      setInitialSupply('');
                      setHasCollateral(false);
                      setCollateralToken('0x');
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                  >
                    Launch Another Token
                  </button>
                  <Link
                    href="/mint"
                    className="block w-full px-6 py-3 bg-white/5 border border-white/10 rounded-lg font-semibold text-center hover:bg-white/10 transition-all"
                  >
                    Go to Minting
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10 space-y-6">
              {/* Token Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Token Name</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g., Private Dollar"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Token Symbol */}
              <div>
                <label className="block text-sm font-medium mb-2">Token Symbol</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., PUSD"
                  maxLength={10}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Initial Supply */}
              <div>
                <label className="block text-sm font-medium mb-2">Initial Supply (Optional)</label>
                <input
                  type="number"
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(e.target.value)}
                  placeholder="0"
                  step="any"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty for 0 initial supply</p>
              </div>

              {/* Collateral Backing Toggle */}
              <div className="bg-white/5 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Collateral-Backed Token</p>
                    <p className="text-sm text-gray-400">Require ERC20 collateral for minting</p>
                  </div>
                  <button
                    onClick={() => setHasCollateral(!hasCollateral)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      hasCollateral ? 'bg-purple-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        hasCollateral ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {hasCollateral && (
                  <div className="pt-4 border-t border-white/10">
                    <label className="block text-sm font-medium mb-2">Collateral Token Address</label>
                    <input
                      type="text"
                      value={collateralToken}
                      onChange={(e) => setCollateralToken(e.target.value as `0x${string}`)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                    />
                    {collateralTokenName && (
                      <p className="text-sm text-gray-400 mt-2">
                        Token: {collateralTokenName as string} ({collateralTokenSymbol as string})
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Info Boxes */}
              <div className="space-y-3">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-sm text-purple-300">
                    <strong>Privacy Features:</strong> All token transfers will be shielded using zero-knowledge proofs.
                    Transaction amounts and recipient addresses will be private.
                  </p>
                </div>

                {hasCollateral && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                      <strong>Collateral Backing:</strong> Users will need to lock the specified ERC20 token as collateral
                      to mint your confidential token at a 1:1 ratio.
                    </p>
                  </div>
                )}
              </div>

              {/* Launch Button */}
              <button
                onClick={handleLaunch}
                disabled={!canLaunch || isPending || isConfirming}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending || isConfirming ? 'Launching Token...' : 'Launch Token'}
              </button>

              {/* Transaction Status */}
              {hash && (
                <div className="bg-white/5 rounded-lg p-4 text-sm">
                  <p className="text-gray-400">Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}</p>
                  {isConfirming && <p className="text-yellow-400 mt-1">Waiting for confirmation...</p>}
                </div>
              )}

              {/* Feature Preview */}
              {tokenName && tokenSymbol && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Token Preview:</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
                      {tokenSymbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{tokenName}</p>
                      <p className="text-sm text-gray-400">{tokenSymbol}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
