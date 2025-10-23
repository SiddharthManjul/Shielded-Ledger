#!/bin/bash

# Compile Circom circuits
echo "Compiling circuits..."
echo ""

# Create build directory if it doesn't exist
mkdir -p build

# Compile example circuit

echo "Deposit.circom"
circom src/deposit.circom --r1cs --wasm --sym -o build/
echo ""

echo "Transfer.circom"
circom src/transfer.circom --r1cs --wasm --sym -o build/
echo ""

echo "Withdraw.circom"
circom src/withdraw.circom --r1cs --wasm --sym -o build/
echo ""

echo "Compilation complete!"
