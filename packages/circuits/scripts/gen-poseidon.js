#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { poseidonContract } = require('circomlibjs');

async function main() {
  const outputDir = path.join(__dirname, '../../contracts/src/libraries');

  // Generate Poseidon contract for T=3 (2 inputs + 1 output)
  const contractCode = await poseidonContract.createCode(2);

  // Wrap it in a proper Solidity contract format
  const solidityCode = `// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is auto-generated with circomlibjs poseidonContract.createCode(2)

    DO NOT EDIT MANUALLY
*/
pragma solidity ^0.8.30;

library PoseidonT3 {
    function poseidon(uint256[2] memory input) public pure returns (uint256) {}
}
contract PoseidonT3Contract {
${contractCode}
}
`;

  const outputPath = path.join(outputDir, 'PoseidonT3.sol');
  fs.writeFileSync(outputPath, solidityCode);
  console.log(`Poseidon contract generated at: ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
