// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import {PriceOracle} from "../src/core/PriceOracle.sol";

/// @title RegisterPriceFeeds
/// @notice Foundry script to register Pyth price feeds for supported tokens
/// @dev Run with: forge script script/RegisterPriceFeeds.s.sol:RegisterPriceFeeds --rpc-url <RPC_URL> --broadcast
contract RegisterPriceFeeds is Script {
    // Pyth Price Feed IDs (from https://pyth.network/developers/price-feed-ids)
    bytes32 constant PYUSD_USD_FEED_ID = 0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692;
    bytes32 constant BTC_USD_FEED_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 constant ETH_USD_FEED_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 constant HBAR_USD_FEED_ID = 0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd;

    struct TokenConfig {
        string symbol;
        address tokenAddress;
        bytes32 priceFeedId;
    }

    function run() external {
        // Read parameters from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address priceOracleAddress = vm.envAddress("PRICE_ORACLE_ADDRESS");

        // Token addresses - these should be set via environment variables
        // For testnet, you might use mock tokens
        address pyusdAddress = vm.envOr("PYUSD_TOKEN_ADDRESS", address(0));
        address btcAddress = vm.envOr("BTC_TOKEN_ADDRESS", address(0));
        address ethAddress = vm.envOr("ETH_TOKEN_ADDRESS", address(0));
        address hbarAddress = vm.envOr("HBAR_TOKEN_ADDRESS", address(0));

        // Configure tokens to register
        TokenConfig[] memory tokens = new TokenConfig[](4);
        tokens[0] = TokenConfig("PYUSD", pyusdAddress, PYUSD_USD_FEED_ID);
        tokens[1] = TokenConfig("BTC", btcAddress, BTC_USD_FEED_ID);
        tokens[2] = TokenConfig("ETH", ethAddress, ETH_USD_FEED_ID);
        tokens[3] = TokenConfig("HBAR", hbarAddress, HBAR_USD_FEED_ID);

        PriceOracle priceOracle = PriceOracle(priceOracleAddress);

        vm.startBroadcast(deployerPrivateKey);

        console.log("Registering price feeds for PriceOracle at:", priceOracleAddress);
        console.log("=========================================\n");

        // Register each price feed
        for (uint256 i = 0; i < tokens.length; i++) {
            TokenConfig memory token = tokens[i];

            if (token.tokenAddress == address(0)) {
                console.log("Skipping", token.symbol, "- token address not set");
                continue;
            }

            // Check if already registered
            try priceOracle.getPriceFeedId(token.tokenAddress) returns (bytes32 existingFeedId) {
                console.log(token.symbol, "already registered with feed ID:");
                console.logBytes32(existingFeedId);
                continue;
            } catch {
                // Not registered, proceed with registration
            }

            // Register the price feed
            priceOracle.registerPriceFeed(token.tokenAddress, token.priceFeedId);

            console.log(token.symbol, "registered successfully");
            console.log("  Token Address:", token.tokenAddress);
            console.log("  Price Feed ID:");
            console.logBytes32(token.priceFeedId);
            console.log("");
        }

        vm.stopBroadcast();

        console.log("\nPrice feed registration complete!");
        console.log("=========================================");
    }

    /// @notice Helper function to deploy mock tokens for testing
    /// @dev Run this separately if you need to deploy mock tokens first
    function deployMockTokens() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Note: You would need to import and deploy actual mock ERC20 contracts here
        console.log("Mock token deployment not implemented in this script");
        console.log("Please deploy your tokens separately or use existing token addresses");

        vm.stopBroadcast();
    }
}
