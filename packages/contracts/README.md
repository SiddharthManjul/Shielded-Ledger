# DiffiPay Contracts

Solidity smart contracts for DiffiPay built with Foundry.

## Setup

Make sure you have Foundry installed:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Build

```bash
forge build
```

## Test

```bash
forge test
```

For verbose output:
```bash
forge test -vvv
```

## Coverage

```bash
forge coverage
```

## Format

```bash
forge fmt
```

## Deploy

```bash
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
```
