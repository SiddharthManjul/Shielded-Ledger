'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, Rocket, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/mint', label: 'Mint Tokens', icon: Coins },
    { href: '/launch', label: 'Launch Token', icon: Rocket },
  ];

  return (
    <header className={cn("flex justify-between items-center mb-12", className)}>
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-3 group">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-accent to-golden-accent rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 glow-button">
          <Shield className="w-7 h-7 text-black" />
        </div>
        <div>
          <span className="text-2xl font-bold text-yellow-accent">Shielded</span>
          <span className="text-2xl font-bold text-white ml-1">Ledger</span>
        </div>
      </Link>

      {/* Navigation Items */}
      <nav className="hidden md:flex items-center space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300",
                  isActive 
                    ? "bg-yellow-accent text-black glow-button" 
                    : "hover:bg-hover-bg text-white hover:text-yellow-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Connect Wallet */}
      <div className="flex items-center space-x-4">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <Button
                        onClick={openConnectModal}
                        className="glow-button bg-yellow-accent text-black hover:bg-yellow-accent/90 font-semibold px-6"
                      >
                        Connect Wallet
                      </Button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <Button
                        onClick={openChainModal}
                        variant="destructive"
                        className="font-semibold px-6"
                      >
                        Wrong network
                      </Button>
                    );
                  }

                  return (
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={openChainModal}
                        variant="outline"
                        className="bg-card border-border hover:bg-hover-bg"
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              overflow: 'hidden',
                              marginRight: 8,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 16, height: 16 }}
                              />
                            )}
                          </div>
                        )}
                        {chain.name}
                      </Button>

                      <Button
                        onClick={openAccountModal}
                        className="glow-button bg-yellow-accent text-black hover:bg-yellow-accent/90 font-semibold"
                      >
                        {account.displayName}
                        {account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ''}
                      </Button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}