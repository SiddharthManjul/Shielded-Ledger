import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { abis } from '@/lib/contracts';
import { contractAddresses } from '@/lib/config';
import { ZKProof } from '@/types/contracts';

export function useZkERC20(tokenAddress?: `0x${string}`) {
  const address = tokenAddress || contractAddresses.zkERC20;

  // Read functions
  const { data: merkleRoot } = useReadContract({
    address,
    abi: abis.zkERC20,
    functionName: 'getMerkleRoot',
  });

  const { data: nextIndex } = useReadContract({
    address,
    abi: abis.zkERC20,
    functionName: 'getNextIndex',
  });

  const commitmentExists = (commitment: bigint) => {
    const { data } = useReadContract({
      address,
      abi: abis.zkERC20,
      functionName: 'commitmentExists',
      args: [commitment],
    });
    return data as boolean | undefined;
  };

  const isNullifierSpent = (nullifier: bigint) => {
    const { data } = useReadContract({
      address,
      abi: abis.zkERC20,
      functionName: 'isNullifierSpent',
      args: [nullifier],
    });
    return data as boolean | undefined;
  };

  // Write functions
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = async (
    proof: ZKProof,
    commitment: bigint,
    amount: bigint
  ) => {
    writeContract({
      address,
      abi: abis.zkERC20,
      functionName: 'deposit',
      args: [proof.a, proof.b, proof.c, commitment, amount],
    });
  };

  const transfer = async (
    proof: ZKProof,
    nullifiers: [bigint, bigint],
    outputCommitments: [bigint, bigint],
    root: bigint
  ) => {
    writeContract({
      address,
      abi: abis.zkERC20,
      functionName: 'transfer',
      args: [proof.a, proof.b, proof.c, nullifiers, outputCommitments, root],
    });
  };

  const withdraw = async (
    proof: ZKProof,
    nullifier: bigint,
    root: bigint,
    recipient: `0x${string}`,
    amount: bigint
  ) => {
    writeContract({
      address,
      abi: abis.zkERC20,
      functionName: 'withdraw',
      args: [proof.a, proof.b, proof.c, nullifier, root, recipient, amount],
    });
  };

  return {
    // Read data
    merkleRoot,
    nextIndex,
    commitmentExists,
    isNullifierSpent,

    // Write functions
    deposit,
    transfer,
    withdraw,

    // Transaction state
    hash,
    isPending,
    isConfirming,
    isSuccess,
  };
}
