'use client';

import { useAccount, useSignMessage } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, Coins, Rocket, Lock, Zap, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/navigation';
import { GamingCard, CountdownBox, StatsCard } from '@/components/ui/gaming-card';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 22,
    minutes: 15,
    seconds: 30
  });

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

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <Navigation />

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <Badge className="bg-yellow-accent/10 text-yellow-accent border-yellow-accent/30 px-4 py-2 text-sm font-medium">
              🚀 Next-Gen Privacy Protocol
            </Badge>
            
            <h1 className="text-6xl md:text-7xl font-bold">
              <span className="text-glow text-yellow-accent">SHIELDED</span>
              <br />
              <span className="text-white">TOKEN LAUNCHPAD</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Launch entirely new confidential ERC20 tokens or mint confidential tokens backed 1:1 by existing ERC20 assets using zero-knowledge proofs.
            </p>
          </div>

          {/* Countdown */}
          <div className="flex justify-center">
            <CountdownBox 
              timeLeft={timeLeft}
              label="🎯 Beta Launch Countdown"
            />
          </div>

          {/* CTA Section */}
          <div className="space-y-6">
            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">Connect your wallet to get started</p>
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      onClick={openConnectModal}
                      className="glow-button bg-yellow-accent text-black hover:bg-yellow-accent/90 text-lg px-12 py-6 h-auto font-bold"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      CONNECT WALLET
                    </Button>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">Sign message to authenticate</p>
                <Button
                  onClick={handleSignMessage}
                  className="glow-button bg-yellow-accent text-black hover:bg-yellow-accent/90 text-lg px-12 py-6 h-auto font-bold"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  SIGN & ENTER APP
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-yellow-accent font-medium">✓ Authenticated - Redirecting...</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-6xl mx-auto mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Value Locked"
              value="$2.4M"
              change="+15.3%"
              changeType="positive"
              icon={<TrendingUp className="w-6 h-6" />}
            />
            <StatsCard
              title="Tokens Launched"
              value="127"
              change="+8"
              changeType="positive"
              icon={<Rocket className="w-6 h-6" />}
            />
            <StatsCard
              title="Active Users"
              value="3,492"
              change="+24%"
              changeType="positive"
              icon={<Users className="w-6 h-6" />}
            />
            <StatsCard
              title="Shielded Transactions"
              value="15.7K"
              change="+156"
              changeType="positive"
              icon={<Lock className="w-6 h-6" />}
            />
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Choose Your Path</h2>
            <p className="text-muted-foreground text-lg">Two powerful ways to leverage confidential tokens</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <GamingCard
              variant="feature"
              glowColor="yellow"
              title="Mint Confidential Tokens"
              description="Deposit existing ERC20 tokens as collateral to mint confidential tokens with 1:1 backing. Perfect for private holdings and transactions."
              icon={<Coins className="w-6 h-6 text-yellow-accent" />}
              className="cursor-pointer"
              onClick={() => router.push('/mint')}
            >
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Collateral Ratio</span>
                  <span className="text-white font-medium">1:1</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Privacy Level</span>
                  <span className="text-yellow-accent font-medium">100% Shielded</span>
                </div>
                <Button className="w-full mt-4 bg-yellow-accent text-black hover:bg-yellow-accent/90 font-semibold">
                  Start Minting →
                </Button>
              </div>
            </GamingCard>

            <GamingCard
              variant="feature"
              glowColor="blue"
              title="Launch New Token"
              description="Create entirely new confidential ERC20 tokens with built-in privacy features. Ideal for governance, rewards, and private ecosystems."
              icon={<Rocket className="w-6 h-6 text-blue-400" />}
              className="cursor-pointer"
              onClick={() => router.push('/launch')}
            >
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Launch Time</span>
                  <span className="text-white font-medium">~5 minutes</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gas Efficiency</span>
                  <span className="text-blue-400 font-medium">Optimized</span>
                </div>
                <Button className="w-full mt-4 bg-blue-500 text-white hover:bg-blue-600 font-semibold">
                  Launch Token →
                </Button>
              </div>
            </GamingCard>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mt-24">
          <GamingCard title="How It Works" className="p-8">
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: "Connect Wallet",
                  description: "Use any Ethereum wallet to get started with Shielded Ledger"
                },
                {
                  step: 2,
                  title: "Sign Authentication",
                  description: "Verify ownership of your wallet with a simple signature"
                },
                {
                  step: 3,
                  title: "Choose Your Path",
                  description: "Mint confidential tokens or launch a completely new token"
                },
                {
                  step: 4,
                  title: "Transact Privately",
                  description: "All transfers are shielded using zero-knowledge proofs"
                }
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-accent text-black rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </GamingCard>
        </div>
      </div>
    </div>
  );
}
