#!/usr/bin/env node

const { buildPoseidonOpt, poseidonContract } = require("circomlibjs");
const fs = require("fs");
const path = require("path");

async function generatePoseidonContract() {
  console.log("Generating Poseidon Solidity contract...");

  // Generate Poseidon contract for 2 inputs (for Merkle tree hashing)
  const poseidonABI = await poseidonContract.generateABI(2);
  const poseidonCode = await poseidonContract.createCode(2);

  // Add SPDX and pragma
  const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library PoseidonT3 {
    function poseidon(uint256[2] memory input) public pure returns (uint256) {
        assembly {
            // Load Poseidon bytecode
            let _pIn := input
            let _pOut := add(input, 0x40)

            // Copy input to memory
            mstore(0x00, mload(_pIn))
            mstore(0x20, mload(add(_pIn, 0x20)))

            // Load precompiled bytecode
            let success := staticcall(gas(), ${poseidonCode}, 0x00, 0x40, _pOut, 0x20)

            if iszero(success) {
                revert(0, 0)
            }

            return(mload(_pOut), 0x20)
        }
    }
}`;

  // Write to contracts directory
  const outputPath = path.join(
    __dirname,
    "../../contracts/src/libraries/PoseidonT3.sol"
  );

  fs.writeFileSync(outputPath, contractCode);
  console.log(`✓ Poseidon contract generated at: ${outputPath}`);
}

generatePoseidonContract().catch(console.error);
