// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {PoseidonT3} from "./PoseidonT3.sol";

library MerkleTree {
    uint256 public constant TREE_DEPTH = 20;
    uint256 public constant MAX_LEAVES = 2 ** TREE_DEPTH;
    bytes32 public constant ZERO_VALUE = bytes32(0);

    struct Tree {
        uint256 nextIndex;
        mapping(uint256 => bytes32) leaves;
        mapping(uint256 => mapping(uint256 => bytes32)) branches;
        bytes32 root;
    }

    function hashLeftRight(bytes32 left, bytes32 right) internal pure returns (bytes32 result) {
        result = PoseidonT3.hash(left, right);
    }

    function zeros(uint256 level) internal pure returns (bytes32 zero) {
        if (level == 0) return ZERO_VALUE;

        bytes32 subZero = zeros(level - 1);
        return hashLeftRight(subZero, subZero);
    }

    function initialize(Tree storage self) internal {
        self.nextIndex = 0;
        self.root = zeros(TREE_DEPTH);
    }

    function insert(Tree storage self, bytes32 leaf) internal returns (uint256 index) {
        require(self.nextIndex < MAX_LEAVES, "MerkleTree: tree is full");

        index = self.nextIndex;
        self.leaves[index] = leaf;

        bytes32 currentHash = leaf;
        uint256 currentIndex = index;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            self.branches[i][currentIndex] = currentHash;

            bytes32 sibling;
            if (currentIndex % 2 == 0) {
                uint256 siblingIndex = currentIndex + 1;
                sibling = self.branches[i][siblingIndex];
                if (sibling == bytes32(0)) {
                    sibling = zeros(i);
                }
                currentHash = hashLeftRight(currentHash, sibling);
            } else {
                uint256 siblingIndex = currentIndex - 1;
                sibling = self.branches[i][siblingIndex];
                currentHash = hashLeftRight(sibling, currentHash);
            }

            currentIndex = currentIndex / 2;
        }

        self.root = currentHash;
        self.nextIndex++;
    }

    function verify(
        bytes32 root,
        bytes32 leaf,
        uint256 index,
        bytes32[] memory path
    ) internal pure returns (bool valid) {
        require(path.length == TREE_DEPTH, "MerkleTree: invalid path length");

        bytes32 currentHash = leaf;
        uint256 currentIndex = index;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            bytes32 sibling = path[i];

            if (currentIndex % 2 == 0) {
                currentHash = hashLeftRight(currentHash, sibling);
            } else {
                currentHash = hashLeftRight(sibling, currentHash);
            }

            currentIndex = currentIndex / 2;
        }

        return currentHash == root;
    }

    function getRoot(Tree storage self) internal view returns (bytes32 root) {
        return self.root;
    }

    function getNextIndex(Tree storage self) internal view returns (uint256 index) {
        return self.nextIndex;
    }

    function leafExists(Tree storage self, uint256 index) internal view returns (bool exists) {
        return index < self.nextIndex;
    }
}