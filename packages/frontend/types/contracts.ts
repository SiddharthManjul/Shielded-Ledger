// Contract types
export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}

export interface MintParams {
  collateralToken: `0x${string}`;
  amount: bigint;
  recipient: `0x${string}`;
}

export interface LaunchParams {
  name: string;
  symbol: string;
  initialSupply: bigint;
  hasCollateral: boolean;
  collateralToken?: `0x${string}`;
}

export interface ZKProof {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
}

export interface DepositProof extends ZKProof {
  commitment: bigint;
  nullifier: bigint;
}

export interface TransferProof extends ZKProof {
  nullifiers: [bigint, bigint];
  outputCommitments: [bigint, bigint];
  root: bigint;
}

export interface WithdrawProof extends ZKProof {
  nullifier: bigint;
  root: bigint;
  recipient: `0x${string}`;
  amount: bigint;
}
