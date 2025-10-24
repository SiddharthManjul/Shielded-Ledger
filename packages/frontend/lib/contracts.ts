// Contract ABIs
import zkERC20ABI from './abi/zkERC20.json';
import CollateralManagerABI from './abi/CollateralManager.json';
import StealthAddressRegistryABI from './abi/StealthAddressRegistry.json';
import PriceOracleABI from './abi/PriceOracle.json';
import MockERC20ABI from './abi/MockERC20.json';
import DepositVerifierABI from './abi/verifiers/DepositVerifier.json';
import TransferVerifierABI from './abi/verifiers/TransferVerifier.json';
import WithdrawVerifierABI from './abi/verifiers/WithdrawVerifier.json';

// Export ABIs
export const abis = {
  zkERC20: zkERC20ABI.abi,
  CollateralManager: CollateralManagerABI.abi,
  StealthAddressRegistry: StealthAddressRegistryABI.abi,
  PriceOracle: PriceOracleABI.abi,
  MockERC20: MockERC20ABI.abi,
  DepositVerifier: DepositVerifierABI.abi,
  TransferVerifier: TransferVerifierABI.abi,
  WithdrawVerifier: WithdrawVerifierABI.abi,
} as const;
