# Shielded Ledger Circuits

Zero-knowledge circuits for DiffiPay built with Circom.

## Prerequisites

Install Circom and snarkjs:

```bash
# Install Circom
curl -L https://github.com/iden3/circom/releases/download/v2.1.6/circom-linux-amd64 -o circom
chmod +x circom
sudo mv circom /usr/local/bin/

# Install snarkjs
npm install -g snarkjs
```

## Setup

```bash
npm install
```

## Compile Circuits

```bash
npm run compile
```

## Test

```bash
npm test
```

## Generate Verifier Contracts

```bash
npm run build:contracts
```

This will generate Solidity verifier contracts in the `contracts/` directory that can be used in the smart contracts package.

## Directory Structure

```
circuits/
├── circuits/       # Circom circuit files (.circom)
├── scripts/        # Build and compilation scripts
├── test/          # Circuit tests
├── build/         # Compiled circuits (r1cs, wasm, etc.)
└── contracts/     # Generated Solidity verifier contracts
```
