import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { abis } from '@/lib/contracts';

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tokenAddress?: `0x${string}`;
  userAddress?: `0x${string}`;
  placeholder?: string;
  disabled?: boolean;
}

export function TokenInput({
  label,
  value,
  onChange,
  tokenAddress,
  userAddress,
  placeholder = '0.0',
  disabled = false,
}: TokenInputProps) {
  const [showMax, setShowMax] = useState(false);

  // Read token info
  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: abis.MockERC20,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: abis.MockERC20,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress },
  });

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: abis.MockERC20,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!tokenAddress && !!userAddress },
  });

  useEffect(() => {
    setShowMax(!!balance && !!decimals);
  }, [balance, decimals]);

  const handleMaxClick = () => {
    if (balance && decimals) {
      onChange(formatUnits(balance as bigint, decimals as number));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          step="any"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-24"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showMax && !disabled && (
            <button
              type="button"
              onClick={handleMaxClick}
              className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-xs font-medium transition-colors"
            >
              MAX
            </button>
          )}
          {symbol && <span className="text-gray-400 text-sm">{symbol as string}</span>}
        </div>
      </div>
      {balance !== undefined && decimals !== undefined && (
        <p className="text-xs text-gray-400">
          Balance: {formatUnits(balance as bigint, decimals as number)} {symbol as string}
        </p>
      )}
    </div>
  );
}
