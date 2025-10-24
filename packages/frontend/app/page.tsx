'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('shielded-ledger-auth');
    if (authStatus === address) {
      setIsAuthenticated(true);
    }
  }, [address]);

  useEffect(() => {
    // Auto-redirect if authenticated
    if (isAuthenticated && isConnected) {
      router.push('/mint');
    }
  }, [isAuthenticated, isConnected, router]);

  const handleSignMessage = async () => {
    if (!address) return;

    try {
      await signMessage(
        { message: `Sign this message to authenticate with Shielded Ledger.\n\nWallet: ${address}\nTimestamp: ${Date.now()}` },
        {
          onSuccess: () => {
            localStorage.setItem('shielded-ledger-auth', address);
            setIsAuthenticated(true);
            router.push('/mint');
          },
        }
      );
    } catch (error) {
      console.error('Error signing message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-20">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-2xl font-bold">Shielded Ledger</span>
          </div>
          <ConnectButton />
        </header>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Confidential Token Launchpad
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Launch entirely new confidential ERC20 tokens or mint confidential tokens backed 1:1 by existing ERC20 assets using zero-knowledge proofs.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Token Minting</h3>
              <p className="text-gray-400">
                Mint confidential tokens backed 1:1 by your existing ERC20 tokens as collateral. Complete privacy for your holdings.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-pink-500/50 transition-all">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Token Launch</h3>
              <p className="text-gray-400">
                Launch entirely new confidential ERC20 tokens with built-in privacy. Perfect for private governance, rewards, and more.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12">
            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-gray-400">Connect your wallet to get started</p>
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-gray-400">Sign message to authenticate</p>
                <button
                  onClick={handleSignMessage}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                >
                  Sign & Enter App
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-green-400">✓ Authenticated - Redirecting...</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-24">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm">1</span>
                <p><strong>Connect your wallet</strong> - Use any Ethereum wallet to get started</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm">2</span>
                <p><strong>Sign authentication message</strong> - Verify ownership of your wallet</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm">3</span>
                <p><strong>Choose your path</strong> - Mint confidential tokens or launch a new token</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm">4</span>
                <p><strong>Transact privately</strong> - All transfers are shielded using zero-knowledge proofs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
