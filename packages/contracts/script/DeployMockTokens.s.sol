// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

/// @title DeployMockTokens
/// @notice Deploy mock ERC20 tokens for testing the PriceOracle integration
/// @dev This is only for testing purposes on testnet
contract DeployMockTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying mock tokens...");
        console.log("Deployer:", deployer);
        console.log("=========================================\n");

        // Deploy PYUSD Mock
        MockERC20 pyusd = new MockERC20("PayPal USD", "PYUSD");
        pyusd.mint(deployer, 1_000_000 * 10**18);
        console.log("PYUSD Mock deployed at:", address(pyusd));

        // Deploy BTC Mock (using 8 decimals like real BTC)
        MockERC20 btc = new MockERC20("Wrapped Bitcoin", "WBTC");
        btc.mint(deployer, 100 * 10**8);
        console.log("WBTC Mock deployed at:", address(btc));

        // Deploy ETH Mock
        MockERC20 eth = new MockERC20("Wrapped Ethereum", "WETH");
        eth.mint(deployer, 1_000 * 10**18);
        console.log("WETH Mock deployed at:", address(eth));

        // Deploy HBAR Mock
        MockERC20 hbar = new MockERC20("Wrapped HBAR", "WHBAR");
        hbar.mint(deployer, 10_000 * 10**18);
        console.log("WHBAR Mock deployed at:", address(hbar));

        vm.stopBroadcast();

        console.log("\n=========================================");
        console.log("Mock tokens deployed successfully!");
        console.log("\nAdd these addresses to your .env file:");
        console.log("PYUSD_TOKEN_ADDRESS=", vm.toString(address(pyusd)));
        console.log("BTC_TOKEN_ADDRESS=", vm.toString(address(btc)));
        console.log("ETH_TOKEN_ADDRESS=", vm.toString(address(eth)));
        console.log("HBAR_TOKEN_ADDRESS=", vm.toString(address(hbar)));

        // Save deployment info
        string memory output = string.concat(
            "{\n",
            '  "pyusd": "', vm.toString(address(pyusd)), '",\n',
            '  "btc": "', vm.toString(address(btc)), '",\n',
            '  "eth": "', vm.toString(address(eth)), '",\n',
            '  "hbar": "', vm.toString(address(hbar)), '"\n',
            "}"
        );

        vm.writeFile("deployments/mock-tokens.json", output);
    }
}
