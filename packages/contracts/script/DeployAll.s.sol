// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import {PriceOracle} from "../src/core/PriceOracle.sol";
import {CollateralManager} from "../src/core/CollateralManager.sol";
import {StealthAddressRegistry} from "../src/core/StealthAddressRegistry.sol";
import {zkERC20} from "../src/core/zkERC20.sol";
import {Groth16Verifier as DepositVerifier} from "../src/verifiers/DepositVerifier.sol";
import {Groth16Verifier as TransferVerifier} from "../src/verifiers/TransferVerifier.sol";
import {Groth16Verifier as WithdrawVerifier} from "../src/verifiers/WithdrawVerifier.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

/// @title DeployAll
/// @notice Comprehensive deployment script for the entire Shielded Ledger system on Hedera
/// @dev Deploys: Verifiers -> PriceOracle -> CollateralManager -> StealthAddressRegistry -> zkERC20 tokens
contract DeployAll is Script {
    // Deployment configuration
    struct DeploymentConfig {
        address pythContract;
        bool deployMockTokens;
        bool registerPriceFeeds;
        bool deployZkTokens;
        uint256 zkTokenDenomination;
    }

    // Pyth Price Feed IDs
    bytes32 constant PYUSD_USD_FEED_ID = 0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692;
    bytes32 constant BTC_USD_FEED_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 constant ETH_USD_FEED_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 constant HBAR_USD_FEED_ID = 0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd;

    // Deployed contract addresses (stored for output)
    struct DeployedContracts {
        address depositVerifier;
        address transferVerifier;
        address withdrawVerifier;
        address priceOracle;
        address collateralManager;
        address stealthAddressRegistry;
        // Mock tokens
        address pyusdToken;
        address btcToken;
        address ethToken;
        address hbarToken;
        // zkERC20 tokens
        address zkPYUSD;
        address zkBTC;
        address zkETH;
        address zkHBAR;
    }

    DeployedContracts public deployed;

    function run() external {
        // Read configuration from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        DeploymentConfig memory config = DeploymentConfig({
            pythContract: vm.envOr("PYTH_CONTRACT_ADDRESS", address(0)),
            deployMockTokens: vm.envOr("DEPLOY_MOCK_TOKENS", uint256(1)) == 1,
            registerPriceFeeds: vm.envOr("REGISTER_PRICE_FEEDS", uint256(1)) == 1,
            deployZkTokens: vm.envOr("DEPLOY_ZK_TOKENS", uint256(1)) == 1,
            zkTokenDenomination: vm.envOr("ZK_TOKEN_DENOMINATION", uint256(10**18))
        });

        require(config.pythContract != address(0), "PYTH_CONTRACT_ADDRESS not set in .env");

        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Shielded Ledger Deployment on Hedera");
        console.log("=========================================\n");

        // Step 1: Deploy Verifiers
        console.log("Step 1: Deploying ZK Verifiers...");
        deployVerifiers();

        // Step 2: Deploy PriceOracle
        console.log("\nStep 2: Deploying PriceOracle...");
        deployPriceOracle(config.pythContract);

        // Step 3: Deploy CollateralManager
        console.log("\nStep 3: Deploying CollateralManager...");
        deployCollateralManager();

        // Step 4: Deploy StealthAddressRegistry
        console.log("\nStep 4: Deploying StealthAddressRegistry...");
        deployStealthAddressRegistry();

        // Step 5: Deploy or get mock tokens
        if (config.deployMockTokens) {
            console.log("\nStep 5: Deploying Mock Tokens...");
            deployMockTokens();
        } else {
            console.log("\nStep 5: Using existing token addresses from .env...");
            loadExistingTokens();
        }

        // Step 6: Register price feeds
        if (config.registerPriceFeeds) {
            console.log("\nStep 6: Registering Price Feeds...");
            registerPriceFeeds();
        }

        // Step 7: Deploy zkERC20 tokens
        if (config.deployZkTokens) {
            console.log("\nStep 7: Deploying zkERC20 Tokens...");
            deployZkTokens(config.zkTokenDenomination);
        }

        vm.stopBroadcast();

        // Step 8: Output deployment summary
        printDeploymentSummary();
        saveDeploymentInfo();
    }

    function deployVerifiers() internal {
        deployed.depositVerifier = address(new DepositVerifier());
        console.log("  DepositVerifier:", deployed.depositVerifier);

        deployed.transferVerifier = address(new TransferVerifier());
        console.log("  TransferVerifier:", deployed.transferVerifier);

        deployed.withdrawVerifier = address(new WithdrawVerifier());
        console.log("  WithdrawVerifier:", deployed.withdrawVerifier);
    }

    function deployPriceOracle(address pythContract) internal {
        PriceOracle priceOracle = new PriceOracle(pythContract);
        deployed.priceOracle = address(priceOracle);
        console.log("  PriceOracle:", deployed.priceOracle);
        console.log("  Pyth Contract:", pythContract);
    }

    function deployCollateralManager() internal {
        CollateralManager collateralManager = new CollateralManager(deployed.priceOracle);
        deployed.collateralManager = address(collateralManager);
        console.log("  CollateralManager:", deployed.collateralManager);
    }

    function deployStealthAddressRegistry() internal {
        StealthAddressRegistry registry = new StealthAddressRegistry();
        deployed.stealthAddressRegistry = address(registry);
        console.log("  StealthAddressRegistry:", deployed.stealthAddressRegistry);
    }

    function deployMockTokens() internal {
        // PYUSD Mock
        MockERC20 pyusd = new MockERC20("PayPal USD", "PYUSD");
        deployed.pyusdToken = address(pyusd);
        pyusd.mint(msg.sender, 1_000_000 * 10**18);
        console.log("  PYUSD Mock:", deployed.pyusdToken);

        // BTC Mock (8 decimals)
        MockERC20 btc = new MockERC20("Wrapped Bitcoin", "WBTC");
        deployed.btcToken = address(btc);
        btc.mint(msg.sender, 100 * 10**8);
        console.log("  WBTC Mock:", deployed.btcToken);

        // ETH Mock
        MockERC20 eth = new MockERC20("Wrapped Ethereum", "WETH");
        deployed.ethToken = address(eth);
        eth.mint(msg.sender, 1_000 * 10**18);
        console.log("  WETH Mock:", deployed.ethToken);

        // HBAR Mock
        MockERC20 hbar = new MockERC20("Wrapped HBAR", "WHBAR");
        deployed.hbarToken = address(hbar);
        hbar.mint(msg.sender, 10_000 * 10**18);
        console.log("  WHBAR Mock:", deployed.hbarToken);
    }

    function loadExistingTokens() internal {
        deployed.pyusdToken = vm.envAddress("PYUSD_TOKEN_ADDRESS");
        deployed.btcToken = vm.envAddress("BTC_TOKEN_ADDRESS");
        deployed.ethToken = vm.envAddress("ETH_TOKEN_ADDRESS");
        deployed.hbarToken = vm.envAddress("HBAR_TOKEN_ADDRESS");

        console.log("  PYUSD:", deployed.pyusdToken);
        console.log("  BTC:", deployed.btcToken);
        console.log("  ETH:", deployed.ethToken);
        console.log("  HBAR:", deployed.hbarToken);
    }

    function registerPriceFeeds() internal {
        PriceOracle priceOracle = PriceOracle(deployed.priceOracle);

        // Register PYUSD
        if (deployed.pyusdToken != address(0)) {
            priceOracle.registerPriceFeed(deployed.pyusdToken, PYUSD_USD_FEED_ID);
            console.log("  PYUSD price feed registered");
        }

        // Register BTC
        if (deployed.btcToken != address(0)) {
            priceOracle.registerPriceFeed(deployed.btcToken, BTC_USD_FEED_ID);
            console.log("  BTC price feed registered");
        }

        // Register ETH
        if (deployed.ethToken != address(0)) {
            priceOracle.registerPriceFeed(deployed.ethToken, ETH_USD_FEED_ID);
            console.log("  ETH price feed registered");
        }

        // Register HBAR
        if (deployed.hbarToken != address(0)) {
            priceOracle.registerPriceFeed(deployed.hbarToken, HBAR_USD_FEED_ID);
            console.log("  HBAR price feed registered");
        }
    }

    function deployZkTokens(uint256 denomination) internal {
        CollateralManager collateralManager = CollateralManager(deployed.collateralManager);

        // Deploy zkPYUSD
        if (deployed.pyusdToken != address(0)) {
            zkERC20 zkPYUSD = new zkERC20(
                "Private PYUSD",
                "zkPYUSD",
                deployed.depositVerifier,
                deployed.transferVerifier,
                deployed.withdrawVerifier,
                deployed.collateralManager,
                denomination
            );
            deployed.zkPYUSD = address(zkPYUSD);
            collateralManager.registerZkToken(deployed.zkPYUSD, deployed.pyusdToken);
            console.log("  zkPYUSD:", deployed.zkPYUSD);
        }

        // Deploy zkBTC
        if (deployed.btcToken != address(0)) {
            zkERC20 zkBTC = new zkERC20(
                "Private Bitcoin",
                "zkBTC",
                deployed.depositVerifier,
                deployed.transferVerifier,
                deployed.withdrawVerifier,
                deployed.collateralManager,
                denomination
            );
            deployed.zkBTC = address(zkBTC);
            collateralManager.registerZkToken(deployed.zkBTC, deployed.btcToken);
            console.log("  zkBTC:", deployed.zkBTC);
        }

        // Deploy zkETH
        if (deployed.ethToken != address(0)) {
            zkERC20 zkETH = new zkERC20(
                "Private Ethereum",
                "zkETH",
                deployed.depositVerifier,
                deployed.transferVerifier,
                deployed.withdrawVerifier,
                deployed.collateralManager,
                denomination
            );
            deployed.zkETH = address(zkETH);
            collateralManager.registerZkToken(deployed.zkETH, deployed.ethToken);
            console.log("  zkETH:", deployed.zkETH);
        }

        // Deploy zkHBAR
        if (deployed.hbarToken != address(0)) {
            zkERC20 zkHBAR = new zkERC20(
                "Private HBAR",
                "zkHBAR",
                deployed.depositVerifier,
                deployed.transferVerifier,
                deployed.withdrawVerifier,
                deployed.collateralManager,
                denomination
            );
            deployed.zkHBAR = address(zkHBAR);
            collateralManager.registerZkToken(deployed.zkHBAR, deployed.hbarToken);
            console.log("  zkHBAR:", deployed.zkHBAR);
        }
    }

    function printDeploymentSummary() internal view {
        console.log("\n=========================================");
        console.log("Deployment Summary");
        console.log("=========================================\n");

        console.log("Core Infrastructure:");
        console.log("  DepositVerifier:        ", deployed.depositVerifier);
        console.log("  TransferVerifier:       ", deployed.transferVerifier);
        console.log("  WithdrawVerifier:       ", deployed.withdrawVerifier);
        console.log("  PriceOracle:            ", deployed.priceOracle);
        console.log("  CollateralManager:      ", deployed.collateralManager);
        console.log("  StealthAddressRegistry: ", deployed.stealthAddressRegistry);

        console.log("\nUnderlying Tokens:");
        console.log("  PYUSD: ", deployed.pyusdToken);
        console.log("  BTC:   ", deployed.btcToken);
        console.log("  ETH:   ", deployed.ethToken);
        console.log("  HBAR:  ", deployed.hbarToken);

        console.log("\nzkERC20 Tokens:");
        console.log("  zkPYUSD: ", deployed.zkPYUSD);
        console.log("  zkBTC:   ", deployed.zkBTC);
        console.log("  zkETH:   ", deployed.zkETH);
        console.log("  zkHBAR:  ", deployed.zkHBAR);

        console.log("\n=========================================");
    }

    function saveDeploymentInfo() internal {
        string memory json = string.concat(
            "{\n",
            '  "network": "hedera-testnet",\n',
            '  "timestamp": "', vm.toString(block.timestamp), '",\n',
            '  "deployer": "', vm.toString(msg.sender), '",\n',
            '  "verifiers": {\n',
            '    "deposit": "', vm.toString(deployed.depositVerifier), '",\n',
            '    "transfer": "', vm.toString(deployed.transferVerifier), '",\n',
            '    "withdraw": "', vm.toString(deployed.withdrawVerifier), '"\n',
            '  },\n',
            '  "core": {\n',
            '    "priceOracle": "', vm.toString(deployed.priceOracle), '",\n',
            '    "collateralManager": "', vm.toString(deployed.collateralManager), '",\n',
            '    "stealthAddressRegistry": "', vm.toString(deployed.stealthAddressRegistry), '"\n',
            '  },\n',
            '  "underlyingTokens": {\n',
            '    "pyusd": "', vm.toString(deployed.pyusdToken), '",\n',
            '    "btc": "', vm.toString(deployed.btcToken), '",\n',
            '    "eth": "', vm.toString(deployed.ethToken), '",\n',
            '    "hbar": "', vm.toString(deployed.hbarToken), '"\n',
            '  },\n',
            '  "zkTokens": {\n',
            '    "zkPYUSD": "', vm.toString(deployed.zkPYUSD), '",\n',
            '    "zkBTC": "', vm.toString(deployed.zkBTC), '",\n',
            '    "zkETH": "', vm.toString(deployed.zkETH), '",\n',
            '    "zkHBAR": "', vm.toString(deployed.zkHBAR), '"\n',
            '  },\n',
            '  "priceFeeds": {\n',
            '    "PYUSD_USD": "0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692",\n',
            '    "BTC_USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",\n',
            '    "ETH_USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",\n',
            '    "HBAR_USD": "0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd"\n',
            '  }\n',
            '}'
        );

        vm.writeFile("deployments/hedera-testnet-latest.json", json);
        console.log("\nDeployment info saved to: deployments/hedera-testnet-latest.json");
    }
}
