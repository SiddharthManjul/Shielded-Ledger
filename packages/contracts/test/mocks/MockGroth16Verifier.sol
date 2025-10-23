// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IGroth16Verifier} from "../../src/interfaces/IGroth16Verifier.sol";

contract MockGroth16Verifier is IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[] calldata
    ) external pure override returns (bool) {
        return true;
    }
}

contract MockFailingVerifier is IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[] calldata
    ) external pure override returns (bool) {
        return false;
    }
}