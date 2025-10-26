'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, Rocket, Coins, Wallet, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Wallet },
    { href: '/mint', label: 'Mint', icon: Coins },
    { href: '/transfer', label: 'Transfer', icon: Send },
    { href: '/launch', label: 'Launch', icon: Rocket },
  ];

  return (
    <header className={cn("flex justify-between items-center mb-12", className)}>
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-3 group">
        <div className="w-12 h-12 bg-linear-to-br from-yellow-accent to-golden-accent flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 glow-button corner-cut">
          <Shield className="w-7 h-7 text-black" />
        </div>
        <div>
          <span className="text-2xl font-display font-bold text-yellow-accent">Shielded</span>
          <span className="text-2xl font-display font-bold text-white ml-1">Ledger</span>
        </div>
      </Link>

      {/* Navigation Items - Hidden on home page */}
      {pathname !== '/' && (
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "flex items-center space-x-2 transition-all duration-300 corner-cut",
                    isActive && "shadow-lg shadow-yellow-accent/20"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      )}

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
                        className="corner-cut"
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
                        className="corner-cut"
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
                        className="corner-cut-lg"
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
                        className="corner-cut"
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