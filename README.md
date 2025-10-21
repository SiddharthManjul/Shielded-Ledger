# Shielded Ledger

A privacy-preserving payment solution using zero-knowledge proofs, built with Solidity smart contracts, Circom ZK circuits, and a Next.js frontend.

## Project Structure

```
DiffiPay/
├── packages/
│   ├── contracts/       # Solidity smart contracts (Foundry)
│   ├── circuits/        # Circom ZK circuits
│   └── frontend/        # Next.js TypeScript frontend
├── package.json         # Monorepo configuration
└── README.md
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Circom](https://docs.circom.io/getting-started/installation/)
- [snarkjs](https://github.com/iden3/snarkjs)

## Quick Start

### Install Dependencies

```bash
# Install all workspace dependencies
npm run install:all
```

### Development

```bash
# Run frontend development server
npm run frontend:dev

# Build contracts
npm run contracts:build

# Run contract tests
npm run contracts:test

# Compile circuits
npm run circuits:compile

# Run circuit tests
npm run circuits:test
```

## Packages

### Contracts (`packages/contracts`)

Solidity smart contracts built with Foundry framework.

- Build: `npm run contracts:build`
- Test: `npm run contracts:test`
- See [packages/contracts/README.md](packages/contracts/README.md) for details

### Circuits (`packages/circuits`)

Zero-knowledge circuits built with Circom.

- Compile: `npm run circuits:compile`
- Test: `npm run circuits:test`
- Generate verifiers: `npm run circuits:build:contracts`
- See [packages/circuits/README.md](packages/circuits/README.md) for details

### Frontend (`packages/frontend`)

Next.js application with TypeScript and Tailwind CSS.

- Dev: `npm run frontend:dev`
- Build: `npm run frontend:build`
- Start: `npm run frontend:start`

## Workflow

1. Design and implement ZK circuits in `packages/circuits`
2. Compile circuits and generate Solidity verifier contracts
3. Integrate verifier contracts into main contracts in `packages/contracts`
4. Deploy contracts and interact via the Next.js frontend

## License

MIT
