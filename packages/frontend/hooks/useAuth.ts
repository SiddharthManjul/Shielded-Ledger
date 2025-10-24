import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setIsAuthenticated(false);
      return;
    }

    const authStatus = localStorage.getItem('shielded-ledger-auth');
    setIsAuthenticated(authStatus === address);
  }, [address, isConnected]);

  const authenticate = (walletAddress: string) => {
    localStorage.setItem('shielded-ledger-auth', walletAddress);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('shielded-ledger-auth');
    setIsAuthenticated(false);
    router.push('/');
  };

  const requireAuth = () => {
    if (!isConnected || !isAuthenticated) {
      router.push('/');
      return false;
    }
    return true;
  };

  return {
    isAuthenticated,
    authenticate,
    logout,
    requireAuth,
  };
}
