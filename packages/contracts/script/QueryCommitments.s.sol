// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {zkERC20} from "../src/core/zkERC20.sol";

contract QueryCommitments is Script {
    function run() external view {
        address zkERC20Address = 0x87A982EFB66729B30404B8e4093EBCb7Fd86CF5f;

        zkERC20 token = zkERC20(zkERC20Address);

        console.log("=== Querying zkERC20 Contract ===");
        console.log("Contract address:", zkERC20Address);

        bytes32 merkleRoot = token.getMerkleRoot();
        console.log("\nCurrent Merkle Root:");
        console.log("Decimal:", uint256(merkleRoot));
        console.log("Hex:", vm.toString(merkleRoot));

        uint256 nextIndex = token.getNextIndex();
        console.log("\nNext Index:", nextIndex);
        console.log("Total commitments:", nextIndex);
    }
}
