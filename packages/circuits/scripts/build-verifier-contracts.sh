#!/bin/bash

# Generate Solidity verifier contracts from circuits
echo "Generating verifier contracts..."

mkdir -p contracts

# Example: generate verifier for example circuit
# snarkjs zkey export solidityverifier build/example_final.zkey contracts/ExampleVerifier.sol

echo "Verifier contracts generated!"
