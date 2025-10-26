"use client";

import { Navigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GamingCard } from "@/components/ui/gaming-card";
import { contractAddresses } from "@/lib/config";
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Coins,
  Database,
  ExternalLink,
  Lock,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSignMessage } from "wagmi";
import { formatUnits } from "viem";

interface Note {
  commitment: string;
  index: number;
  amount: bigint;
  secret: string;
  nullifier: string;
  spent: boolean;
}

interface ChainNote {
  commitment: string;
  index: number;
  amount: string;
  encryptedNote: string;
  sender: string;
  blockNumber: string;
  timestamp?: string;
  transactionHash: string;
}

interface DashboardStats {
  totalNotes: number;
  totalAmount: bigint;
  userNotes: number;
  userAmount: bigint;
  recentActivity: ChainNote[];
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const [, setAuthState] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    totalNotes: 0,
    totalAmount: BigInt(0),
    userNotes: 0,
    userAmount: BigInt(0),
    recentActivity: [],
  });
  const [allNotes, setAllNotes] = useState<ChainNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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


  // Migrate old localStorage data on mount
  useEffect(() => {
    if (!address) return;

    // Check if we need to migrate localStorage data
    const migrationKey = `notes-migration-v2-${address}`;
    const hasMigrated = localStorage.getItem(migrationKey);

    if (!hasMigrated) {
      console.log("Migrating localStorage data to new format...");
      const notesKey = `notes-${address}`;
      const oldNotes = localStorage.getItem(notesKey);

      if (oldNotes) {
        try {
          const parsed = JSON.parse(oldNotes);
          // Check if any note has invalid nullifier format (not hex string)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hasInvalidFormat = parsed.some((note: any) => {
            return note.nullifier && !note.nullifier.startsWith('0x');
          });

          if (hasInvalidFormat) {
            console.log("Found old format data, clearing...");
            localStorage.removeItem(notesKey);
          }
        } catch (error) {
          console.error("Error during migration:", error);
          localStorage.removeItem(notesKey);
        }
      }

      localStorage.setItem(migrationKey, 'true');
      console.log("Migration complete");
    }
  }, [address]);

  // Fetch all dashboard stats and commitments
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const firstMintBlock = localStorage.getItem("zkERC20-first-mint-block") || "0";
        console.log("[Dashboard] Fetching all notes from block:", firstMintBlock);

        // Fetch all notes using HyperSync API
        const response = await fetch(
          `/api/hypersync-indexer?address=${contractAddresses.zkERC20}&fromBlock=${firstMintBlock}&allNotes=true`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("[Dashboard] Fetched notes:", data.notes);

        const chainNotes: ChainNote[] = data.notes;
        setAllNotes(chainNotes);

        // Calculate total stats
        const totalAmount = chainNotes.reduce(
          (sum, note) => sum + BigInt(note.amount),
          BigInt(0)
        );

        // Get user's notes from localStorage
        const storedNotes = localStorage.getItem(`notes-${address}`);
        const userLocalNotes = storedNotes ? JSON.parse(storedNotes) : [];

        // Calculate user stats
        const userCommitments = new Set(
          userLocalNotes.map((n: Note) => n.commitment.toLowerCase())
        );
        const userNotesFromChain = chainNotes.filter((note) =>
          userCommitments.has(note.commitment.toLowerCase())
        );
        const userAmount = userNotesFromChain.reduce(
          (sum, note) => sum + BigInt(note.amount),
          BigInt(0)
        );

        setStats({
          totalNotes: chainNotes.length,
          totalAmount,
          userNotes: userNotesFromChain.length,
          userAmount,
          recentActivity: chainNotes.slice(-10).reverse(),
        });
      } catch (error) {
        console.error("[Dashboard] Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, address]);

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="mx-auto px-4 py-8 container">
        <Navigation />

        {/* Header */}
        <div className="mx-auto mb-8 max-w-6xl">
          <div className="mb-8 text-center">
            <Badge variant="gaming" className="mb-4">
              <Activity className="mr-2 w-4 h-4" />
              Analytics Dashboard
            </Badge>
            <h1 className="mb-4 font-display font-bold text-5xl">
              <span className="text-yellow-accent">Privacy</span> Analytics
            </h1>
            <p className="mx-auto max-w-3xl text-muted-foreground text-xl">
              Monitor confidential transactions and system-wide metrics in real-time
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="mx-auto max-w-2xl">
            <GamingCard className="p-8 text-center">
              <Lock className="mx-auto mb-4 w-16 h-16 text-yellow-accent" />
              <h2 className="mb-4 font-bold text-2xl">Authentication Required</h2>
              <p className="mb-6 text-muted-foreground">
                Connect your wallet and sign a message to view the dashboard
              </p>
              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      onClick={openConnectModal}
                      className="h-12"
                      size="lg"
                    >
                      <Coins className="mr-2 w-5 h-5" />
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
                  <CheckCircle className="mr-2 w-5 h-5" />
                  Sign Message to Continue
                </Button>
              )}
            </GamingCard>
          </div>
        ) : (
          <div className="mx-auto space-y-8 max-w-6xl">
            {/* Stats Grid */}
            <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <GamingCard variant="action" glowColor="blue" className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex justify-center items-center bg-blue-500/20 p-3 rounded-lg">
                    <Database className="w-6 h-6 text-blue-400" />
                  </div>
                  <Badge variant="gaming">Global</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Total Notes</p>
                  <p className="font-numbers font-bold text-4xl text-white">
                    {isLoading ? "..." : stats.totalNotes}
                  </p>
                  <p className="text-muted-foreground text-xs">Commitments in tree</p>
                </div>
              </GamingCard>

              <GamingCard variant="action" glowColor="green" className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex justify-center items-center bg-green-500/20 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <Badge variant="gaming-green">TVL</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Total Value</p>
                  <p className="font-numbers font-bold text-4xl text-white">
                    {isLoading ? "..." : formatUnits(stats.totalAmount, 18)}
                  </p>
                  <p className="text-muted-foreground text-xs">ETH locked</p>
                </div>
              </GamingCard>

              <GamingCard variant="action" glowColor="yellow" className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex justify-center items-center bg-yellow-500/20 p-3 rounded-lg">
                    <Coins className="w-6 h-6 text-yellow-400" />
                  </div>
                  <Badge variant="gaming">Your Notes</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Your Holdings</p>
                  <p className="font-numbers font-bold text-4xl text-white">
                    {isLoading ? "..." : stats.userNotes}
                  </p>
                  <p className="text-muted-foreground text-xs">Notes owned</p>
                </div>
              </GamingCard>

              <GamingCard variant="action" glowColor="purple" className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex justify-center items-center bg-purple-500/20 p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                  <Badge variant="gaming">Balance</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Your Balance</p>
                  <p className="font-numbers font-bold text-4xl text-white">
                    {isLoading ? "..." : formatUnits(stats.userAmount, 18)}
                  </p>
                  <p className="text-muted-foreground text-xs">ETH value</p>
                </div>
              </GamingCard>
            </div>

            {/* Recent Activity */}
            <GamingCard className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="flex items-center gap-2 font-semibold text-white text-2xl">
                  <Activity className="w-6 h-6 text-yellow-accent" />
                  Recent Activity
                </h2>
                <Badge variant="gaming">{stats.recentActivity.length} transactions</Badge>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Loading transactions...
                </div>
              ) : stats.recentActivity.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentActivity.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 bg-muted/20 hover:bg-muted/30 p-4 border border-border rounded-lg transition-colors corner-cut"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex shrink-0 justify-center items-center bg-yellow-accent/20 mt-1 p-2 rounded">
                          <CheckCircle className="w-5 h-5 text-yellow-accent" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">Deposit #{note.index}</p>
                            <Badge variant="outline" className="text-xs">Block {note.blockNumber}</Badge>
                            {note.transactionHash && (
                              <a
                                href={`https://testnet.monadexplorer.com/tx/${note.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View
                              </a>
                            )}
                          </div>
                          <p className="font-mono text-muted-foreground text-sm">
                            {note.commitment.slice(0, 20)}...{note.commitment.slice(-20)}
                          </p>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Clock className="w-3 h-3" />
                            {note.timestamp ? new Date(note.timestamp).toLocaleString() : "Unknown time"}
                          </div>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-numbers font-bold text-white text-xl">
                          {formatUnits(BigInt(note.amount), 18)} ETH
                        </p>
                        {note.sender && (
                          <p className="text-muted-foreground text-sm">
                            {note.sender.slice(0, 6)}...{note.sender.slice(-4)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GamingCard>

            {/* All Notes Table */}
            <GamingCard className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="flex items-center gap-2 font-semibold text-white text-2xl">
                  <Database className="w-6 h-6 text-yellow-accent" />
                  All Commitments
                </h2>
                <Badge variant="gaming">{allNotes.length} total</Badge>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Loading commitments...
                </div>
              ) : allNotes.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No commitments found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 font-semibold text-left text-muted-foreground text-sm">Index</th>
                        <th className="px-4 py-3 font-semibold text-left text-muted-foreground text-sm">Commitment</th>
                        <th className="px-4 py-3 font-semibold text-right text-muted-foreground text-sm">Amount</th>
                        <th className="px-4 py-3 font-semibold text-left text-muted-foreground text-sm">Block</th>
                        <th className="px-4 py-3 font-semibold text-left text-muted-foreground text-sm">Sender</th>
                        <th className="px-4 py-3 font-semibold text-center text-muted-foreground text-sm">Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allNotes.map((note, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-white text-sm">{note.index}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground text-sm">
                            {note.commitment.slice(0, 16)}...{note.commitment.slice(-14)}
                          </td>
                          <td className="px-4 py-3 font-numbers text-right text-white">
                            {formatUnits(BigInt(note.amount), 18)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-sm">{note.blockNumber}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground text-sm">
                            {note.sender ? `${note.sender.slice(0, 6)}...${note.sender.slice(-4)}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {note.transactionHash ? (
                              <a
                                href={`https://testnet.monadexplorer.com/tx/${note.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GamingCard>
          </div>
        )}
      </div>
    </div>
  );
}
