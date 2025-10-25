import { useAuth } from "@/hooks/useAuth";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

interface NavHeaderProps {
  showNavigation?: boolean;
}

export function NavHeader({ showNavigation = true }: NavHeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="flex justify-between items-center mb-12">
      <Link href="/" className="flex items-center space-x-2">
        <div className="flex justify-center items-center bg-purple-500 w-10 h-10">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <span className="font-bold text-2xl">Shielded Ledger</span>
      </Link>

      <div className="flex items-center gap-4">
        {showNavigation && (
          <nav className="flex items-center gap-3">
            <Link
              href="/mint"
              className="bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/10 font-medium text-sm transition-all"
            >
              Token Minting
            </Link>
            <Link
              href="/launch"
              className="bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/10 font-medium text-sm transition-all"
            >
              Token Launch
            </Link>
          </nav>
        )}
        <ConnectButton />
        {showNavigation && (
          <button
            onClick={logout}
            className="bg-red-500/10 hover:bg-red-500/20 px-3 py-2 border border-red-500/30 text-red-400 text-sm transition-all"
            title="Logout"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
