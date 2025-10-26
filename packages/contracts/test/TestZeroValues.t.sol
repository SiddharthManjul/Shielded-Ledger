// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MerkleTree} from "../src/libraries/MerkleTree.sol";
import {PoseidonT3} from "../src/libraries/PoseidonT3.sol";

contract TestZeroValues is Test {
    using MerkleTree for MerkleTree.Tree;

    function testZeroValues() public view {
        console.log("Computing zero values using MerkleTree library:");

        for (uint256 i = 0; i <= 3; i++) {
            bytes32 zero = MerkleTree.zeros(i);
            console.log("Level", i, ":", uint256(zero));
        }
    }

    function testMerkleRootWithTwoCommitments() public {
        console.log("\n=== Testing Merkle Root with 2 commitments ===");

        // The commitments from the frontend logs
        bytes32 commitment1 = 0x0a0f602fb0f76990b644c6b9db6669a7c99f2cc9e53479d928254990dca71784;
        bytes32 commitment2 = 0x1faea65e44ce50eec911e86097fe25fe42ac40d76402ae72a7e93ba35f6f1e34;

        console.log("Commitment 1:", uint256(commitment1));
        console.log("Commitment 2:", uint256(commitment2));

        // Initialize tree and insert commitments
        MerkleTree.Tree storage tree;
        assembly {
            tree.slot := 0
        }
        tree.initialize();

        console.log("\nInserting commitment 1...");
        uint256 index1 = tree.insert(commitment1);
        console.log("Inserted at index:", index1);
        console.log("Root after insert 1:", uint256(tree.getRoot()));

        console.log("\nInserting commitment 2...");
        uint256 index2 = tree.insert(commitment2);
        console.log("Inserted at index:", index2);
        console.log("Root after insert 2:", uint256(tree.getRoot()));

        bytes32 finalRoot = tree.getRoot();
        console.log("\n=== Final Merkle Root ===");
        console.log("Root (decimal):", uint256(finalRoot));
        console.log("Root (hex):", uint256(finalRoot));

        // Also manually compute first level hash to compare
        bytes32 level0Hash = PoseidonT3.hash(commitment1, commitment2);
        console.log("\nManual computation:");
        console.log("Level 0 hash of (commitment1, commitment2):", uint256(level0Hash));
    }
}
