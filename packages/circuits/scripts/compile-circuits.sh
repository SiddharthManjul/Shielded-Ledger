#!/bin/bash

# Compile Circom circuits
echo "Compiling circuits..."

# Create build directory if it doesn't exist
mkdir -p build

# Compile example circuit
circom src/deposit.circom --r1cs --wasm --sym -o build/

echo "Compilation complete!"
