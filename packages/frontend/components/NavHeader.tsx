import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/hooks/useAuth';

interface NavHeaderProps {
  showNavigation?: boolean;
}

export function NavHeader({ showNavigation = true }: NavHeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="flex justify-between items-center mb-12">
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <span className="text-2xl font-bold">Shielded Ledger</span>
      </Link>

      <div className="flex items-center gap-4">
        {showNavigation && (
          <nav className="flex items-center gap-3">
            <Link
              href="/mint"
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-sm font-medium"
            >
              Token Minting
            </Link>
            <Link
              href="/launch"
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-sm font-medium"
            >
              Token Launch
            </Link>
          </nav>
        )}
        <ConnectButton />
        {showNavigation && (
          <button
            onClick={logout}
            className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
