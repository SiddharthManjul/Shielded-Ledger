// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title IPoseidonHasher
 * @dev Interface for Poseidon hash contract
 */
interface IPoseidonHasher {
    function hash(uint256[2] memory input) external pure returns (uint256);
}
