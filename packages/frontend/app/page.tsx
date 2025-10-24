"use client";

import { Navigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GamingCard, StatsCard } from "@/components/ui/gaming-card";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Coins,
  Lock,
  Rocket,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem("shielded-ledger-auth");
    if (authStatus === address) {
      setIsAuthenticated(true);
    }
  }, [address]);

  useEffect(() => {
    // Auto-redirect if authenticated
    if (isAuthenticated && isConnected) {
      router.push("/mint");
    }
  }, [isAuthenticated, isConnected, router]);

  const handleSignMessage = async () => {
    if (!address) return;

    try {
      await signMessage(
        {
          message: `Sign this message to authenticate with Shielded Ledger.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`,
        },
        {
          onSuccess: () => {
            localStorage.setItem("shielded-ledger-auth", address);
            setIsAuthenticated(true);
            router.push("/mint");
          },
        }
      );
    } catch (error) {
      console.error("Error signing message:", error);
    }
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="mx-auto px-4 py-8 container">
        {/* Navigation */}
        <Navigation />

        {/* Hero Section */}
        <div className="space-y-12 mx-auto max-w-6xl text-center">
          <div className="space-y-6">
            <Badge className="bg-yellow-accent/10 px-4 py-2 border-yellow-accent/30 font-medium text-yellow-accent text-sm">
              🚀 Next-Gen Privacy Protocol
            </Badge>

            <h1 className="font-display font-bold text-6xl md:text-7xl">
              <span className="font-display-glow text-yellow-accent">
                SHIELDED
              </span>
              <br />
              <span className="text-white">TOKEN LAUNCHPAD</span>
            </h1>

            <p className="mx-auto max-w-3xl text-muted-foreground text-xl leading-relaxed">
              Launch entirely new confidential ERC20 tokens or mint confidential
              tokens backed 1:1 by existing ERC20 assets using zero-knowledge
              proofs.
            </p>
          </div>

          {/* CTA Section */}
          <div className="space-y-6">
            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Connect your wallet to get started
                </p>
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      onClick={openConnectModal}
                      size="xl"
                      className="text-white corner-cut-lg holographic"
                    >
                      <Zap className="mr-2 w-5 h-5" />
                      CONNECT WALLET
                    </Button>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Sign message to authenticate
                </p>
                <Button
                  onClick={handleSignMessage}
                  size="xl"
                  className="corner-cut-lg pulse-glow"
                >
                  <Shield className="mr-2 w-5 h-5" />
                  SIGN & ENTER APP
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-medium text-yellow-accent">
                  ✓ Authenticated - Redirecting...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mx-auto mt-20 max-w-6xl">
          <div className="gap-6 grid grid-cols-2 md:grid-cols-4">
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
        <div className="mx-auto mt-20 max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display font-bold text-white text-4xl">
              Choose Your Path
            </h2>
            <p className="text-muted-foreground text-lg">
              Two powerful ways to leverage confidential tokens
            </p>
          </div>

          <div className="gap-8 grid md:grid-cols-2">
            <GamingCard
              variant="feature"
              glowColor="yellow"
              title="Mint Confidential Tokens"
              description="Deposit existing ERC20 tokens as collateral to mint confidential tokens with 1:1 backing. Perfect for private holdings and transactions."
              icon={<Coins className="w-6 h-6 text-yellow-accent" />}
              className="cursor-pointer"
              onClick={() => router.push("/mint")}
            >
              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Collateral Ratio
                  </span>
                  <span className="font-medium text-white">1:1</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Privacy Level</span>
                  <span className="font-medium text-yellow-accent">
                    100% Shielded
                  </span>
                </div>
                <Button className="mt-4 w-full">Start Minting →</Button>
              </div>
            </GamingCard>

            <GamingCard
              variant="feature"
              glowColor="blue"
              title="Launch New Token"
              description="Create entirely new confidential ERC20 tokens with built-in privacy features. Ideal for governance, rewards, and private ecosystems."
              icon={<Rocket className="w-6 h-6 text-blue-400" />}
              className="cursor-pointer"
              onClick={() => router.push("/launch")}
            >
              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Launch Time</span>
                  <span className="font-medium text-white">~5 minutes</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Gas Efficiency</span>
                  <span className="font-medium text-blue-400">Optimized</span>
                </div>
                <Button variant="info" className="mt-4 w-full">
                  Launch Token →
                </Button>
              </div>
            </GamingCard>
          </div>
        </div>

        {/* How It Works */}
        <div className="mx-auto mt-24 max-w-4xl">
          <GamingCard title="How It Works" className="p-8">
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: "Connect Wallet",
                  description:
                    "Use any Ethereum wallet to get started with Shielded Ledger",
                },
                {
                  step: 2,
                  title: "Sign Authentication",
                  description:
                    "Verify ownership of your wallet with a simple signature",
                },
                {
                  step: 3,
                  title: "Choose Your Path",
                  description:
                    "Mint confidential tokens or launch a completely new token",
                },
                {
                  step: 4,
                  title: "Transact Privately",
                  description:
                    "All transfers are shielded using zero-knowledge proofs",
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-4">
                  <div className="flex flex-shrink-0 justify-center items-center bg-yellow-accent rounded-full w-8 h-8 font-numbers font-bold text-black text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">
                      {item.title}
                    </h3>
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
