// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import {PriceOracle} from "../src/core/PriceOracle.sol";

/// @title DeployPriceOracle
/// @notice Foundry script to deploy PriceOracle contract
/// @dev Run with: forge script script/DeployPriceOracle.s.sol:DeployPriceOracle --rpc-url <RPC_URL> --broadcast --verify
contract DeployPriceOracle is Script {
    // Pyth Network contract address on Hedera Testnet
    // Update this address for mainnet deployment
    address constant PYTH_CONTRACT_HEDERA_TESTNET = address(0); // TODO: Add official Pyth Hedera testnet address
    address constant PYTH_CONTRACT_HEDERA_MAINNET = address(0); // TODO: Add official Pyth Hedera mainnet address

    function run() external {
        // Read deployment parameters from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address pythContract = vm.envOr("PYTH_CONTRACT_ADDRESS", PYTH_CONTRACT_HEDERA_TESTNET);

        require(pythContract != address(0), "Pyth contract address not set");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy PriceOracle
        PriceOracle priceOracle = new PriceOracle(pythContract);

        console.log("PriceOracle deployed at:", address(priceOracle));
        console.log("Pyth contract address:", pythContract);
        console.log("Owner:", priceOracle.owner());

        vm.stopBroadcast();

        // Save deployment info
        string memory output = string.concat(
            "{\n",
            '  "priceOracle": "', vm.toString(address(priceOracle)), '",\n',
            '  "pythContract": "', vm.toString(pythContract), '",\n',
            '  "owner": "', vm.toString(priceOracle.owner()), '"\n',
            "}"
        );

        vm.writeFile("deployments/latest-price-oracle.json", output);
        console.log("\nDeployment info saved to deployments/latest-price-oracle.json");
    }
}
