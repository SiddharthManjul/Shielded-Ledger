// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {PoseidonT3 as PoseidonHasher} from "./PoseidonHasher.sol";

/**
 * @title PoseidonT3
 * @dev Poseidon hash function library for 2 inputs
 * This is a thin wrapper that uses the external PoseidonHasher library
 * to avoid code size limits in contracts that import this
 */
library PoseidonT3 {
    /**
     * @dev Hash two bytes32 values using Poseidon
     * This matches the circuit implementation using circomlib's Poseidon(2)
     */
    function hash(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        uint256[2] memory input;
        input[0] = uint256(left);
        input[1] = uint256(right);
        return bytes32(PoseidonHasher.hash(input));
    }
}
