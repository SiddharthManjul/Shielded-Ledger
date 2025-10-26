// Contract addresses - Deployed contracts
// This file can be imported in both client and server code
export const contractAddresses = {
  PoseidonHasher: '0x5ed774b5A11F42DFDf336bf804d72044C075A286',
  zkERC20: '0x87A982EFB66729B30404B8e4093EBCb7Fd86CF5f',
  CollateralManager: '0xe3A29914bbf6a6a6a6e95Dc7884162879Ec67103',
  StealthAddressRegistry: '0x66FCc4DAC95b3D900E6526bfC6907E96B712930C',
  PriceOracle: '0x171882B104fEfBEb8aB085aCEc9866438A04B322',
  DepositVerifier: '0xd7B43DCCFD4006eAd9678D5a2e2450d6aE9f63cE',
  TransferVerifier: '0x3b1cb5eA0e93220B5632F3e6Efa36408b68583cf',
  WithdrawVerifier: '0x7941A688948f1242b4A39FE935143c92aB80D200',
} as const;

// Deployment block numbers - Update these when you deploy new contracts
// This optimizes indexing by only scanning from deployment block onwards
export const deploymentBlocks = {
  // Set this to the block number where your zkERC20 contract was deployed
  // You can find this in the transaction receipt of the deployment
  zkERC20: 0, // TODO: Update this with actual deployment block
} as const;
