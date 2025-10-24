import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { abis } from '@/lib/contracts';
import { contractAddresses } from '@/lib/config';

export function useCollateralManager() {
  const address = contractAddresses.CollateralManager;

  // Read functions
  const getUnderlyingToken = (zkToken: `0x${string}`) => {
    const { data } = useReadContract({
      address,
      abi: abis.CollateralManager,
      functionName: 'getUnderlyingToken',
      args: [zkToken],
    });
    return data as `0x${string}` | undefined;
  };

  const getTotalCollateral = (zkToken: `0x${string}`) => {
    const { data } = useReadContract({
      address,
      abi: abis.CollateralManager,
      functionName: 'getTotalCollateral',
      args: [zkToken],
    });
    return data as bigint | undefined;
  };

  const getUnderlyingTokenPrice = (zkToken: `0x${string}`) => {
    const { data } = useReadContract({
      address,
      abi: abis.CollateralManager,
      functionName: 'getUnderlyingTokenPrice',
      args: [zkToken],
    });
    return data as bigint | undefined;
  };

  const getTotalCollateralValue = (zkToken: `0x${string}`) => {
    const { data } = useReadContract({
      address,
      abi: abis.CollateralManager,
      functionName: 'getTotalCollateralValue',
      args: [zkToken],
    });
    return data as bigint | undefined;
  };

  // Write functions
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const registerZkToken = async (
    zkToken: `0x${string}`,
    underlyingToken: `0x${string}`
  ) => {
    writeContract({
      address,
      abi: abis.CollateralManager,
      functionName: 'registerZkToken',
      args: [zkToken, underlyingToken],
    });
  };

  const lockCollateral = async (
    zkToken: `0x${string}`,
    amount: bigint
  ) => {
    writeContract({
      address,
      abi: abis.CollateralManager,
      functionName: 'lockCollateral',
      args: [zkToken, amount],
    });
  };

  const releaseCollateral = async (
    zkToken: `0x${string}`,
    to: `0x${string}`,
    amount: bigint
  ) => {
    writeContract({
      address,
      abi: abis.CollateralManager,
      functionName: 'releaseCollateral',
      args: [zkToken, to, amount],
    });
  };

  return {
    // Read functions
    getUnderlyingToken,
    getTotalCollateral,
    getUnderlyingTokenPrice,
    getTotalCollateralValue,

    // Write functions
    registerZkToken,
    lockCollateral,
    releaseCollateral,

    // Transaction state
    hash,
    isPending,
    isConfirming,
    isSuccess,
  };
}
