import { abis } from "@/lib/contracts";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";

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
  placeholder = "0.0",
  disabled = false,
}: TokenInputProps) {
  const [showMax, setShowMax] = useState(false);

  // Read token info
  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: abis.MockERC20,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: abis.MockERC20,
    functionName: "decimals",
    query: { enabled: !!tokenAddress },
  });

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: abis.MockERC20,
    functionName: "balanceOf",
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
      <label className="block font-medium text-gray-300 text-sm">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          step="any"
          className="bg-white/5 disabled:opacity-50 px-4 py-3 pr-24 border border-white/10 focus:border-purple-500 focus:outline-none w-full transition-all disabled:cursor-not-allowed"
        />
        <div className="top-1/2 right-3 absolute flex items-center gap-2 -translate-y-1/2">
          {showMax && !disabled && (
            <button
              type="button"
              onClick={handleMaxClick}
              className="bg-purple-500/20 hover:bg-purple-500/30 px-2 py-1 rounded font-medium text-purple-300 text-xs transition-colors"
            >
              MAX
            </button>
          )}
          {symbol && (
            <span className="text-gray-400 text-sm">{symbol as string}</span>
          )}
        </div>
      </div>
      {balance !== undefined && decimals !== undefined && (
        <p className="text-gray-400 text-xs">
          Balance: {formatUnits(balance as bigint, decimals as number)}{" "}
          {symbol as string}
        </p>
      )}
    </div>
  );
}
