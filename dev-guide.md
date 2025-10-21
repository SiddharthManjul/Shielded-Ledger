# Shielded Ledger: Complete Development Guide

**A Privacy-Preserving Payment System Built on DiffiChain**

This guide covers everything from scratch to build Shielded Ledger - a confidential payment system where users can convert stablecoins (PYUSD, USDC, USDT) into privacy-preserving zkTokens and use them for private peer-to-peer payments.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [DiffiChain Foundation](#diffichain-foundation)
4. [Shielded Ledger Extensions](#Shielded Ledger-extensions)
5. [Smart Contract Development](#smart-contract-development)
6. [ZK Circuits for Payments](#zk-circuits-for-payments)
7. [Frontend Development](#frontend-development)
8. [Payment Features](#payment-features)
9. [Deployment Guide](#deployment-guide)
10. [Testing Strategy](#testing-strategy)
11. [Security Considerations](#security-considerations)
12. [User Flows](#user-flows)

---

## Project Overview

### What is Shielded Ledger?

Shielded Ledger is a **privacy-preserving payment system** that allows users to:

1. **Convert stablecoins to zkTokens**: Wrap PYUSD → zkPYUSD, USDC → zkUSDC
2. **Make private payments**: Send zkTokens to anyone without revealing amounts
3. **Use stealth addresses**: Recipients receive payments at one-time addresses
4. **Request payments**: Generate payment requests with QR codes
5. **Split bills**: Divide payments among multiple recipients
6. **Recurring payments**: Set up automated private payments
7. **Cash out anytime**: Convert zkTokens back to stablecoins

### Why Shielded Ledger?

**Privacy Problems in Traditional Payments:**
- Every transaction is public on blockchain (amount, sender, receiver)
- Payment history can be tracked and analyzed
- No financial privacy for users

**Shielded Ledger Solution:**
- Zero-knowledge proofs hide transaction details
- Only commitments and nullifiers are public
- Unlinkable payments using stealth addresses
- 1:1 backing with trusted stablecoins (PYUSD, USDC)

### Key Features

#### Core Features (from DiffiChain)
- ✅ zkToken minting (stablecoin → zkStablecoin)
- ✅ Private transfers using ZK proofs
- ✅ Stealth addresses (ERC-5564)
- ✅ Note-based UTXO model
- ✅ Merkle tree commitment tracking
- ✅ Collateral management (1:1 backing)

#### Payment Features (Shielded Ledger Extensions)
- 🆕 **Payment Requests**: Generate payable invoices with amounts
- 🆕 **QR Code Payments**: Scan and pay instantly
- 🆕 **Payment Links**: Share payment links via any channel
- 🆕 **Split Payments**: Divide bills among multiple people
- 🆕 **Recurring Payments**: Set up subscription-like payments
- 🆕 **Payment Notifications**: Off-chain notifications for received payments
- 🆕 **Payment Metadata**: Encrypted memos and notes
- 🆕 **Multi-Currency**: Support multiple stablecoins (PYUSD, USDC, USDT)
- 🆕 **Atomic Swaps**: Swap between zkPYUSD ↔ zkUSDC privately
- 🆕 **Merchant Integration**: API for businesses to accept zkTokens

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Shielded Ledger Application                        │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  User Wallets    │  │  Payment UI      │  │  Merchant    │ │
│  │  - zkPYUSD       │  │  - QR codes      │  │  Integration │ │
│  │  - zkUSDC        │  │  - Payment links │  │  - API       │ │
│  │  - zkUSDT        │  │  - Split bills   │  │  - Webhooks  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ZK Proof Generation (snarkjs)               │  │
│  │  - Payment proofs  - Transfer proofs  - Swap proofs     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Web3 RPC + Contract calls
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                Smart Contracts (Monad Testnet)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   DiffiChain Base Layer                   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  zkERC20 (Privacy Layer)                                 │  │
│  │  - Deposit/Transfer/Withdraw with ZK proofs              │  │
│  │  - Merkle tree for commitments                           │  │
│  │  - Nullifier tracking                                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  CollateralManager (Vault)                               │  │
│  │  - Holds PYUSD, USDC, USDT                               │  │
│  │  - 1:1 backing enforcement                               │  │
│  │  - Price oracle integration                              │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  StealthAddressRegistry (ERC-5564)                       │  │
│  │  - Stealth payment announcements                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Shielded Ledger Extensions                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  PaymentRequestManager                                   │  │
│  │  - Create payment requests                               │  │
│  │  - Track payment status                                  │  │
│  │  - Expiration handling                                   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  RecurringPaymentManager                                 │  │
│  │  - Setup subscriptions                                   │  │
│  │  - Automated payments                                    │  │
│  │  - Cancellation                                          │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  AtomicSwap                                              │  │
│  │  - zkPYUSD ↔ zkUSDC swaps                                │  │
│  │  - Privacy-preserving exchange                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  MerchantGateway                                         │  │
│  │  - Merchant registration                                 │  │
│  │  - Payment verification                                  │  │
│  │  - Settlement tracking                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Event indexing
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend Services                              │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Indexer         │  │  Notification    │  │  Payment     │ │
│  │  (Envio)         │  │  Service         │  │  Gateway API │ │
│  │  - Events        │  │  - Push notifs   │  │  - Webhooks  │ │
│  │  - GraphQL API   │  │  - Email/SMS     │  │  - API keys  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Layer 1: DiffiChain Foundation
- **zkERC20**: Base privacy token contract
- **CollateralManager**: Stablecoin vault
- **StealthAddressRegistry**: Anonymous receiving
- **Verifiers**: ZK proof verification (deposit, transfer, withdraw)

#### Layer 2: Shielded Ledger Extensions
- **PaymentRequestManager**: Invoice generation and tracking
- **RecurringPaymentManager**: Subscription payments
- **AtomicSwap**: Privacy-preserving token swaps
- **MerchantGateway**: Business payment acceptance

#### Layer 3: Application Layer
- **Web/Mobile Frontend**: User interface
- **Merchant Dashboard**: Business analytics
- **Backend Services**: Notifications, indexing, APIs

---

## DiffiChain Foundation

### Starting Point: Base Infrastructure

Shielded Ledger builds on top of the complete DiffiChain implementation. Before starting Shielded Ledger development, ensure you have:

#### 1. DiffiChain Contracts Deployed

```
contracts/src/
├── core/
│   ├── zkERC20.sol              ✅ Base privacy token
│   ├── CollateralManager.sol    ✅ Stablecoin vault
│   └── StealthAddressRegistry.sol ✅ Stealth addresses
├── libraries/
│   └── MerkleTree.sol           ✅ Commitment tracking
├── verifiers/
│   ├── DepositVerifier.sol      ✅ Generated from circuits
│   ├── TransferVerifier.sol     ✅ Generated from circuits
│   └── WithdrawVerifier.sol     ✅ Generated from circuits
└── interfaces/
    ├── IzkERC20.sol
    ├── ICollateralManager.sol
    └── IGroth16Verifier.sol
```

#### 2. ZK Circuits Compiled

```
circuits/
├── deposit.circom        ✅ Mint zkTokens
├── transfer.circom       ✅ Private transfers
├── withdraw.circom       ✅ Burn to stablecoins
└── build/
    ├── deposit.wasm
    ├── transfer.wasm
    └── withdraw.wasm
```

#### 3. Frontend Foundation

```
frontend/
├── src/
│   ├── lib/
│   │   ├── zkProof.ts           ✅ Proof generation
│   │   ├── stealthAddress.ts    ✅ ERC-5564 implementation
│   │   ├── crypto.ts            ✅ Poseidon hash
│   │   └── noteManager.ts       ✅ Note storage (IndexedDB)
│   └── hooks/
│       ├── useNotes.ts          ✅ Note management
│       └── useBalance.ts        ✅ Balance calculation
```

### If Starting from Scratch

If you don't have DiffiChain yet, follow these steps:

#### Step 1: Clone/Setup Base Project

```bash
# Create project directory
mkdir Shielded Ledger
cd Shielded Ledger

# Initialize monorepo structure
mkdir -p contracts circuits frontend backend indexer

# Initialize each component
cd contracts && forge init
cd ../circuits && npm init -y
cd ../frontend && npx create-next-app@latest .
cd ../backend && npm init -y
```

#### Step 2: Install Dependencies

**Contracts (Foundry):**
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

**Circuits (Circom):**
```bash
cd circuits
npm install -g circom snarkjs
npm install circomlib
```

**Frontend (Next.js):**
```bash
cd frontend
npm install viem wagmi @tanstack/react-query snarkjs circomlibjs \
  @noble/curves @noble/hashes dexie zustand
```

#### Step 3: Implement DiffiChain Base (from existing contracts)

Copy the base contracts from DiffiChain:
- `zkERC20.sol`
- `CollateralManager.sol`
- `StealthAddressRegistry.sol`
- `MerkleTree.sol`
- All interfaces

Copy the circuits:
- `deposit.circom`
- `transfer.circom`
- `withdraw.circom`

---

## Shielded Ledger Extensions

### New Smart Contracts

#### 1. PaymentRequestManager.sol

**Purpose**: Manage payment invoices with amounts, expiry, and metadata.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title PaymentRequestManager
/// @notice Manages payment requests/invoices for Shielded Ledger
contract PaymentRequestManager is Ownable {

    // ============ Structs ============

    struct PaymentRequest {
        bytes32 id;                    // Unique payment request ID
        address payee;                 // Who receives payment
        address zkToken;               // Which zkToken (zkPYUSD, zkUSDC, etc.)
        uint256 amount;                // Requested amount
        uint256 createdAt;             // Creation timestamp
        uint256 expiresAt;             // Expiration timestamp
        bool isPaid;                   // Payment status
        bytes32 commitment;            // Commitment of payment note (if paid)
        bytes encryptedMemo;           // Encrypted payment memo
        bytes stealthAddress;          // Stealth address for payment
    }

    // ============ State Variables ============

    /// @notice Mapping of payment request ID => PaymentRequest
    mapping(bytes32 => PaymentRequest) public paymentRequests;

    /// @notice Mapping of payee => array of their payment request IDs
    mapping(address => bytes32[]) public payeeRequests;

    /// @notice Counter for generating unique IDs
    uint256 private nonce;

    // ============ Events ============

    event PaymentRequestCreated(
        bytes32 indexed requestId,
        address indexed payee,
        address indexed zkToken,
        uint256 amount,
        uint256 expiresAt
    );

    event PaymentRequestFulfilled(
        bytes32 indexed requestId,
        bytes32 indexed commitment
    );

    event PaymentRequestCancelled(bytes32 indexed requestId);

    // ============ Errors ============

    error PaymentRequestNotFound();
    error PaymentRequestExpired();
    error PaymentAlreadyFulfilled();
    error UnauthorizedCancellation();
    error InvalidExpiryTime();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Functions ============

    /// @notice Create a new payment request
    /// @param zkToken The zkToken to receive (zkPYUSD, zkUSDC, etc.)
    /// @param amount Amount requested
    /// @param expiresIn Time until expiration (in seconds)
    /// @param encryptedMemo Encrypted memo/description
    /// @param stealthAddress Stealth address for receiving payment
    /// @return requestId The unique payment request ID
    function createPaymentRequest(
        address zkToken,
        uint256 amount,
        uint256 expiresIn,
        bytes calldata encryptedMemo,
        bytes calldata stealthAddress
    ) external returns (bytes32 requestId) {
        if (expiresIn == 0) revert InvalidExpiryTime();

        // Generate unique ID
        requestId = keccak256(abi.encodePacked(
            msg.sender,
            zkToken,
            amount,
            block.timestamp,
            nonce++
        ));

        uint256 expiresAt = block.timestamp + expiresIn;

        // Create payment request
        paymentRequests[requestId] = PaymentRequest({
            id: requestId,
            payee: msg.sender,
            zkToken: zkToken,
            amount: amount,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            isPaid: false,
            commitment: bytes32(0),
            encryptedMemo: encryptedMemo,
            stealthAddress: stealthAddress
        });

        // Track payee's requests
        payeeRequests[msg.sender].push(requestId);

        emit PaymentRequestCreated(
            requestId,
            msg.sender,
            zkToken,
            amount,
            expiresAt
        );
    }

    /// @notice Fulfill a payment request (called by zkERC20 contract)
    /// @param requestId The payment request ID
    /// @param commitment The commitment of the payment note
    function fulfillPaymentRequest(
        bytes32 requestId,
        bytes32 commitment
    ) external {
        PaymentRequest storage request = paymentRequests[requestId];

        if (request.id == bytes32(0)) revert PaymentRequestNotFound();
        if (block.timestamp > request.expiresAt) revert PaymentRequestExpired();
        if (request.isPaid) revert PaymentAlreadyFulfilled();

        // Mark as paid
        request.isPaid = true;
        request.commitment = commitment;

        emit PaymentRequestFulfilled(requestId, commitment);
    }

    /// @notice Cancel a payment request (only by payee)
    /// @param requestId The payment request ID
    function cancelPaymentRequest(bytes32 requestId) external {
        PaymentRequest storage request = paymentRequests[requestId];

        if (request.id == bytes32(0)) revert PaymentRequestNotFound();
        if (request.payee != msg.sender) revert UnauthorizedCancellation();
        if (request.isPaid) revert PaymentAlreadyFulfilled();

        // Delete the request
        delete paymentRequests[requestId];

        emit PaymentRequestCancelled(requestId);
    }

    /// @notice Get payment request details
    /// @param requestId The payment request ID
    function getPaymentRequest(bytes32 requestId)
        external
        view
        returns (PaymentRequest memory)
    {
        return paymentRequests[requestId];
    }

    /// @notice Get all payment requests for a payee
    /// @param payee The payee address
    function getPayeeRequests(address payee)
        external
        view
        returns (bytes32[] memory)
    {
        return payeeRequests[payee];
    }

    /// @notice Check if payment request is still valid
    /// @param requestId The payment request ID
    function isValidPaymentRequest(bytes32 requestId)
        external
        view
        returns (bool)
    {
        PaymentRequest memory request = paymentRequests[requestId];

        return request.id != bytes32(0) &&
               !request.isPaid &&
               block.timestamp <= request.expiresAt;
    }
}
```

#### 2. RecurringPaymentManager.sol

**Purpose**: Handle subscription-style recurring payments.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IzkERC20} from "../interfaces/IzkERC20.sol";

/// @title RecurringPaymentManager
/// @notice Manages recurring/subscription payments in Shielded Ledger
contract RecurringPaymentManager is Ownable {

    // ============ Structs ============

    struct RecurringPayment {
        bytes32 id;                    // Unique subscription ID
        address payer;                 // Who pays
        address payee;                 // Who receives
        address zkToken;               // Which zkToken
        uint256 amount;                // Amount per payment
        uint256 interval;              // Time between payments (seconds)
        uint256 startTime;             // When subscription starts
        uint256 lastPaymentTime;       // Last successful payment
        uint256 endTime;               // When subscription ends (0 = indefinite)
        bool isActive;                 // Active status
        bytes stealthAddressPayee;     // Payee's stealth meta-address
    }

    // ============ State Variables ============

    /// @notice Mapping of subscription ID => RecurringPayment
    mapping(bytes32 => RecurringPayment) public subscriptions;

    /// @notice Mapping of payer => array of subscription IDs
    mapping(address => bytes32[]) public payerSubscriptions;

    /// @notice Mapping of payee => array of subscription IDs
    mapping(address => bytes32[]) public payeeSubscriptions;

    /// @notice Counter for unique IDs
    uint256 private nonce;

    // ============ Events ============

    event SubscriptionCreated(
        bytes32 indexed subscriptionId,
        address indexed payer,
        address indexed payee,
        address zkToken,
        uint256 amount,
        uint256 interval
    );

    event SubscriptionPaymentExecuted(
        bytes32 indexed subscriptionId,
        bytes32 indexed commitment,
        uint256 timestamp
    );

    event SubscriptionCancelled(bytes32 indexed subscriptionId);

    event SubscriptionPaused(bytes32 indexed subscriptionId);
    event SubscriptionResumed(bytes32 indexed subscriptionId);

    // ============ Errors ============

    error SubscriptionNotFound();
    error SubscriptionNotActive();
    error PaymentNotDue();
    error UnauthorizedAction();
    error InvalidInterval();
    error SubscriptionExpired();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Functions ============

    /// @notice Create a new recurring payment subscription
    /// @param payee Who receives the payments
    /// @param zkToken Which zkToken to use
    /// @param amount Amount per payment
    /// @param interval Seconds between payments
    /// @param duration Total duration (0 = indefinite)
    /// @param stealthAddressPayee Payee's stealth meta-address
    function createSubscription(
        address payee,
        address zkToken,
        uint256 amount,
        uint256 interval,
        uint256 duration,
        bytes calldata stealthAddressPayee
    ) external returns (bytes32 subscriptionId) {
        if (interval == 0) revert InvalidInterval();

        // Generate unique ID
        subscriptionId = keccak256(abi.encodePacked(
            msg.sender,
            payee,
            zkToken,
            amount,
            interval,
            block.timestamp,
            nonce++
        ));

        uint256 endTime = duration > 0 ? block.timestamp + duration : 0;

        // Create subscription
        subscriptions[subscriptionId] = RecurringPayment({
            id: subscriptionId,
            payer: msg.sender,
            payee: payee,
            zkToken: zkToken,
            amount: amount,
            interval: interval,
            startTime: block.timestamp,
            lastPaymentTime: 0,
            endTime: endTime,
            isActive: true,
            stealthAddressPayee: stealthAddressPayee
        });

        // Track subscriptions
        payerSubscriptions[msg.sender].push(subscriptionId);
        payeeSubscriptions[payee].push(subscriptionId);

        emit SubscriptionCreated(
            subscriptionId,
            msg.sender,
            payee,
            zkToken,
            amount,
            interval
        );
    }

    /// @notice Execute a subscription payment (called off-chain, executed via transfer)
    /// @param subscriptionId The subscription ID
    /// @param commitment The commitment of the payment note
    function executePayment(
        bytes32 subscriptionId,
        bytes32 commitment
    ) external {
        RecurringPayment storage sub = subscriptions[subscriptionId];

        if (sub.id == bytes32(0)) revert SubscriptionNotFound();
        if (!sub.isActive) revert SubscriptionNotActive();

        // Check if payment is due
        uint256 nextPaymentDue = sub.lastPaymentTime == 0
            ? sub.startTime
            : sub.lastPaymentTime + sub.interval;

        if (block.timestamp < nextPaymentDue) revert PaymentNotDue();

        // Check if subscription expired
        if (sub.endTime > 0 && block.timestamp > sub.endTime) {
            revert SubscriptionExpired();
        }

        // Update last payment time
        sub.lastPaymentTime = block.timestamp;

        emit SubscriptionPaymentExecuted(subscriptionId, commitment, block.timestamp);
    }

    /// @notice Cancel a subscription
    /// @param subscriptionId The subscription ID
    function cancelSubscription(bytes32 subscriptionId) external {
        RecurringPayment storage sub = subscriptions[subscriptionId];

        if (sub.id == bytes32(0)) revert SubscriptionNotFound();

        // Only payer or payee can cancel
        if (msg.sender != sub.payer && msg.sender != sub.payee) {
            revert UnauthorizedAction();
        }

        sub.isActive = false;

        emit SubscriptionCancelled(subscriptionId);
    }

    /// @notice Pause a subscription (only payer)
    /// @param subscriptionId The subscription ID
    function pauseSubscription(bytes32 subscriptionId) external {
        RecurringPayment storage sub = subscriptions[subscriptionId];

        if (sub.id == bytes32(0)) revert SubscriptionNotFound();
        if (msg.sender != sub.payer) revert UnauthorizedAction();

        sub.isActive = false;

        emit SubscriptionPaused(subscriptionId);
    }

    /// @notice Resume a paused subscription (only payer)
    /// @param subscriptionId The subscription ID
    function resumeSubscription(bytes32 subscriptionId) external {
        RecurringPayment storage sub = subscriptions[subscriptionId];

        if (sub.id == bytes32(0)) revert SubscriptionNotFound();
        if (msg.sender != sub.payer) revert UnauthorizedAction();

        sub.isActive = true;

        emit SubscriptionResumed(subscriptionId);
    }

    /// @notice Check if payment is due for a subscription
    /// @param subscriptionId The subscription ID
    function isPaymentDue(bytes32 subscriptionId) external view returns (bool) {
        RecurringPayment memory sub = subscriptions[subscriptionId];

        if (sub.id == bytes32(0) || !sub.isActive) return false;
        if (sub.endTime > 0 && block.timestamp > sub.endTime) return false;

        uint256 nextPaymentDue = sub.lastPaymentTime == 0
            ? sub.startTime
            : sub.lastPaymentTime + sub.interval;

        return block.timestamp >= nextPaymentDue;
    }

    /// @notice Get subscription details
    /// @param subscriptionId The subscription ID
    function getSubscription(bytes32 subscriptionId)
        external
        view
        returns (RecurringPayment memory)
    {
        return subscriptions[subscriptionId];
    }

    /// @notice Get all subscriptions for a payer
    /// @param payer The payer address
    function getPayerSubscriptions(address payer)
        external
        view
        returns (bytes32[] memory)
    {
        return payerSubscriptions[payer];
    }

    /// @notice Get all subscriptions for a payee
    /// @param payee The payee address
    function getPayeeSubscriptions(address payee)
        external
        view
        returns (bytes32[] memory)
    {
        return payeeSubscriptions[payee];
    }
}
```

#### 3. AtomicSwap.sol

**Purpose**: Privacy-preserving swaps between different zkTokens.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IzkERC20} from "../interfaces/IzkERC20.sol";
import {IGroth16Verifier} from "../interfaces/IGroth16Verifier.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AtomicSwap
/// @notice Privacy-preserving atomic swaps between zkTokens
contract AtomicSwap is ReentrancyGuard {

    // ============ Structs ============

    struct SwapOffer {
        bytes32 id;                    // Unique swap ID
        address maker;                 // Offer creator
        address zkTokenOffered;        // zkToken being offered
        bytes32 inputNullifier;        // Nullifier of offered note
        uint256 amountOffered;         // Amount offered (revealed for matching)
        address zkTokenWanted;         // zkToken wanted in return
        uint256 amountWanted;          // Amount wanted
        uint256 expiresAt;             // Expiration time
        bool isActive;                 // Active status
        bool isCompleted;              // Completion status
    }

    // ============ State Variables ============

    /// @notice Verifier for swap proofs
    IGroth16Verifier public immutable SWAP_VERIFIER;

    /// @notice Mapping of swap ID => SwapOffer
    mapping(bytes32 => SwapOffer) public swapOffers;

    /// @notice Mapping of maker => array of swap IDs
    mapping(address => bytes32[]) public makerSwaps;

    /// @notice Counter for unique IDs
    uint256 private nonce;

    // ============ Events ============

    event SwapOfferCreated(
        bytes32 indexed swapId,
        address indexed maker,
        address zkTokenOffered,
        uint256 amountOffered,
        address zkTokenWanted,
        uint256 amountWanted
    );

    event SwapCompleted(
        bytes32 indexed swapId,
        address indexed taker
    );

    event SwapCancelled(bytes32 indexed swapId);

    // ============ Errors ============

    error SwapNotFound();
    error SwapExpired();
    error SwapNotActive();
    error InvalidSwapProof();
    error UnauthorizedCancellation();

    // ============ Constructor ============

    constructor(address _swapVerifier) {
        SWAP_VERIFIER = IGroth16Verifier(_swapVerifier);
    }

    // ============ Functions ============

    /// @notice Create a swap offer
    /// @param zkTokenOffered Token being offered
    /// @param inputNullifier Nullifier of offered note
    /// @param amountOffered Amount offered
    /// @param zkTokenWanted Token wanted
    /// @param amountWanted Amount wanted
    /// @param expiresIn Time until expiration (seconds)
    function createSwapOffer(
        address zkTokenOffered,
        bytes32 inputNullifier,
        uint256 amountOffered,
        address zkTokenWanted,
        uint256 amountWanted,
        uint256 expiresIn
    ) external returns (bytes32 swapId) {
        // Generate unique ID
        swapId = keccak256(abi.encodePacked(
            msg.sender,
            zkTokenOffered,
            zkTokenWanted,
            amountOffered,
            amountWanted,
            block.timestamp,
            nonce++
        ));

        uint256 expiresAt = block.timestamp + expiresIn;

        // Create swap offer
        swapOffers[swapId] = SwapOffer({
            id: swapId,
            maker: msg.sender,
            zkTokenOffered: zkTokenOffered,
            inputNullifier: inputNullifier,
            amountOffered: amountOffered,
            zkTokenWanted: zkTokenWanted,
            amountWanted: amountWanted,
            expiresAt: expiresAt,
            isActive: true,
            isCompleted: false
        });

        makerSwaps[msg.sender].push(swapId);

        emit SwapOfferCreated(
            swapId,
            msg.sender,
            zkTokenOffered,
            amountOffered,
            zkTokenWanted,
            amountWanted
        );
    }

    /// @notice Execute a swap (taker accepts offer)
    /// @param swapId The swap offer ID
    /// @param takerInputNullifier Taker's input nullifier
    /// @param makerOutputCommitment Commitment for maker's received note
    /// @param takerOutputCommitment Commitment for taker's received note
    /// @param proofA ZK proof component A
    /// @param proofB ZK proof component B
    /// @param proofC ZK proof component C
    function executeSwap(
        bytes32 swapId,
        bytes32 takerInputNullifier,
        bytes32 makerOutputCommitment,
        bytes32 takerOutputCommitment,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external nonReentrant {
        SwapOffer storage offer = swapOffers[swapId];

        if (offer.id == bytes32(0)) revert SwapNotFound();
        if (!offer.isActive) revert SwapNotActive();
        if (block.timestamp > offer.expiresAt) revert SwapExpired();

        // Verify swap proof
        uint256[] memory publicInputs = new uint256[](6);
        publicInputs[0] = uint256(offer.inputNullifier);
        publicInputs[1] = uint256(takerInputNullifier);
        publicInputs[2] = offer.amountOffered;
        publicInputs[3] = offer.amountWanted;
        publicInputs[4] = uint256(makerOutputCommitment);
        publicInputs[5] = uint256(takerOutputCommitment);

        bool isValid = SWAP_VERIFIER.verifyProof(proofA, proofB, proofC, publicInputs);
        if (!isValid) revert InvalidSwapProof();

        // Mark as completed
        offer.isActive = false;
        offer.isCompleted = true;

        // NOTE: Actual token swaps happen via zkERC20 transfer calls
        // This contract just coordinates and verifies the swap proof

        emit SwapCompleted(swapId, msg.sender);
    }

    /// @notice Cancel a swap offer (only maker)
    /// @param swapId The swap offer ID
    function cancelSwapOffer(bytes32 swapId) external {
        SwapOffer storage offer = swapOffers[swapId];

        if (offer.id == bytes32(0)) revert SwapNotFound();
        if (msg.sender != offer.maker) revert UnauthorizedCancellation();

        offer.isActive = false;

        emit SwapCancelled(swapId);
    }

    /// @notice Get swap offer details
    /// @param swapId The swap offer ID
    function getSwapOffer(bytes32 swapId)
        external
        view
        returns (SwapOffer memory)
    {
        return swapOffers[swapId];
    }

    /// @notice Check if swap offer is valid
    /// @param swapId The swap offer ID
    function isValidSwapOffer(bytes32 swapId)
        external
        view
        returns (bool)
    {
        SwapOffer memory offer = swapOffers[swapId];

        return offer.id != bytes32(0) &&
               offer.isActive &&
               !offer.isCompleted &&
               block.timestamp <= offer.expiresAt;
    }
}
```

#### 4. MerchantGateway.sol

**Purpose**: Allow businesses to accept zkToken payments.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MerchantGateway
/// @notice Merchant payment gateway for Shielded Ledger
contract MerchantGateway is Ownable {

    // ============ Structs ============

    struct Merchant {
        address merchantAddress;       // Merchant wallet
        string businessName;           // Business name
        string apiKey;                 // API key for webhooks
        bool isActive;                 // Active status
        uint256 registeredAt;          // Registration timestamp
        uint256 totalPayments;         // Total payments received
        uint256 totalVolume;           // Total volume processed
    }

    struct MerchantPayment {
        bytes32 paymentId;            // Unique payment ID
        address merchant;              // Merchant address
        address zkToken;               // zkToken used
        uint256 amount;                // Payment amount
        bytes32 commitment;            // Payment commitment
        uint256 timestamp;             // Payment timestamp
        bytes metadata;                // Encrypted order details
    }

    // ============ State Variables ============

    /// @notice Mapping of merchant address => Merchant
    mapping(address => Merchant) public merchants;

    /// @notice Mapping of payment ID => MerchantPayment
    mapping(bytes32 => MerchantPayment) public payments;

    /// @notice Mapping of merchant => array of payment IDs
    mapping(address => bytes32[]) public merchantPayments;

    /// @notice Array of all merchant addresses
    address[] public allMerchants;

    // ============ Events ============

    event MerchantRegistered(
        address indexed merchant,
        string businessName
    );

    event MerchantPaymentReceived(
        bytes32 indexed paymentId,
        address indexed merchant,
        address indexed zkToken,
        uint256 amount,
        bytes32 commitment
    );

    event MerchantDeactivated(address indexed merchant);

    // ============ Errors ============

    error MerchantAlreadyRegistered();
    error MerchantNotRegistered();
    error MerchantNotActive();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Functions ============

    /// @notice Register as a merchant
    /// @param businessName Business/store name
    /// @param apiKey API key for webhooks
    function registerMerchant(
        string calldata businessName,
        string calldata apiKey
    ) external {
        if (merchants[msg.sender].merchantAddress != address(0)) {
            revert MerchantAlreadyRegistered();
        }

        merchants[msg.sender] = Merchant({
            merchantAddress: msg.sender,
            businessName: businessName,
            apiKey: apiKey,
            isActive: true,
            registeredAt: block.timestamp,
            totalPayments: 0,
            totalVolume: 0
        });

        allMerchants.push(msg.sender);

        emit MerchantRegistered(msg.sender, businessName);
    }

    /// @notice Record a merchant payment (called by payment processor)
    /// @param merchant Merchant address
    /// @param zkToken zkToken used
    /// @param amount Payment amount
    /// @param commitment Payment commitment
    /// @param metadata Encrypted order details
    function recordPayment(
        address merchant,
        address zkToken,
        uint256 amount,
        bytes32 commitment,
        bytes calldata metadata
    ) external returns (bytes32 paymentId) {
        Merchant storage m = merchants[merchant];

        if (m.merchantAddress == address(0)) revert MerchantNotRegistered();
        if (!m.isActive) revert MerchantNotActive();

        // Generate payment ID
        paymentId = keccak256(abi.encodePacked(
            merchant,
            zkToken,
            amount,
            commitment,
            block.timestamp
        ));

        // Record payment
        payments[paymentId] = MerchantPayment({
            paymentId: paymentId,
            merchant: merchant,
            zkToken: zkToken,
            amount: amount,
            commitment: commitment,
            timestamp: block.timestamp,
            metadata: metadata
        });

        // Update merchant stats
        merchantPayments[merchant].push(paymentId);
        m.totalPayments++;
        m.totalVolume += amount;

        emit MerchantPaymentReceived(
            paymentId,
            merchant,
            zkToken,
            amount,
            commitment
        );
    }

    /// @notice Deactivate a merchant (only owner or merchant)
    /// @param merchant Merchant address
    function deactivateMerchant(address merchant) external {
        if (msg.sender != merchant && msg.sender != owner()) {
            revert MerchantNotActive();
        }

        Merchant storage m = merchants[merchant];
        if (m.merchantAddress == address(0)) revert MerchantNotRegistered();

        m.isActive = false;

        emit MerchantDeactivated(merchant);
    }

    /// @notice Get merchant details
    /// @param merchant Merchant address
    function getMerchant(address merchant)
        external
        view
        returns (Merchant memory)
    {
        return merchants[merchant];
    }

    /// @notice Get merchant payments
    /// @param merchant Merchant address
    function getMerchantPayments(address merchant)
        external
        view
        returns (bytes32[] memory)
    {
        return merchantPayments[merchant];
    }

    /// @notice Get payment details
    /// @param paymentId Payment ID
    function getPayment(bytes32 paymentId)
        external
        view
        returns (MerchantPayment memory)
    {
        return payments[paymentId];
    }

    /// @notice Get all merchants
    function getAllMerchants() external view returns (address[] memory) {
        return allMerchants;
    }
}
```

---

## ZK Circuits for Payments

### New Circuits Needed

#### 1. swap.circom

**Purpose**: Prove validity of atomic swaps between zkTokens.

```circom
pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

template AtomicSwap() {
    // Private inputs
    signal input makerSecret;
    signal input makerNullifier;
    signal input makerAmount;

    signal input takerSecret;
    signal input takerNullifier;
    signal input takerAmount;

    // Public inputs
    signal input makerInputNullifier;      // hash(makerNullifier, makerSecret)
    signal input takerInputNullifier;      // hash(takerNullifier, takerSecret)
    signal input makerAmountOffered;
    signal input takerAmountOffered;
    signal input makerOutputCommitment;
    signal input takerOutputCommitment;

    // Components
    component makerNullifierHasher = Poseidon(2);
    component takerNullifierHasher = Poseidon(2);

    component makerOutputHasher = Poseidon(3);
    component takerOutputHasher = Poseidon(3);

    component amountCheckMaker = IsEqual();
    component amountCheckTaker = IsEqual();

    // Verify maker nullifier
    makerNullifierHasher.inputs[0] <== makerNullifier;
    makerNullifierHasher.inputs[1] <== makerSecret;
    makerNullifierHasher.out === makerInputNullifier;

    // Verify taker nullifier
    takerNullifierHasher.inputs[0] <== takerNullifier;
    takerNullifierHasher.inputs[1] <== takerSecret;
    takerNullifierHasher.out === takerInputNullifier;

    // Verify amounts match
    amountCheckMaker.in[0] <== makerAmount;
    amountCheckMaker.in[1] <== makerAmountOffered;
    amountCheckMaker.out === 1;

    amountCheckTaker.in[0] <== takerAmount;
    amountCheckTaker.in[1] <== takerAmountOffered;
    amountCheckTaker.out === 1;

    // Verify output commitments
    // Maker receives takerAmount
    makerOutputHasher.inputs[0] <== takerAmount;
    makerOutputHasher.inputs[1] <== makerSecret;  // Re-use secret
    makerOutputHasher.inputs[2] <== makerNullifier + 1; // New nullifier
    makerOutputHasher.out === makerOutputCommitment;

    // Taker receives makerAmount
    takerOutputHasher.inputs[0] <== makerAmount;
    takerOutputHasher.inputs[1] <== takerSecret;
    takerOutputHasher.inputs[2] <== takerNullifier + 1;
    takerOutputHasher.out === takerOutputCommitment;
}

component main {public [
    makerInputNullifier,
    takerInputNullifier,
    makerAmountOffered,
    takerAmountOffered,
    makerOutputCommitment,
    takerOutputCommitment
]} = AtomicSwap();
```

### Updated Circuits

The base circuits (deposit, transfer, withdraw) remain the same from DiffiChain.

---

## Frontend Development

### New Components for Shielded Ledger

#### 1. Payment Request UI

```typescript
// frontend/src/components/payments/CreatePaymentRequest.tsx
'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { QRCodeSVG } from 'qrcode.react'
import { generateStealthMetaAddress } from '@/lib/stealthAddress'
import { usePaymentRequestManager } from '@/hooks/usePaymentRequestManager'

export function CreatePaymentRequest() {
  const { address } = useAccount()
  const { createPaymentRequest } = usePaymentRequestManager()

  const [amount, setAmount] = useState('')
  const [zkToken, setZkToken] = useState('zkPYUSD')
  const [memo, setMemo] = useState('')
  const [expiresIn, setExpiresIn] = useState(3600) // 1 hour
  const [paymentLink, setPaymentLink] = useState('')

  const handleCreateRequest = async () => {
    // Generate stealth address for receiving payment
    const stealthAddress = generateStealthMetaAddress()

    // Encrypt memo
    const encryptedMemo = await encryptMemo(memo, address!)

    // Create payment request on-chain
    const requestId = await createPaymentRequest({
      zkToken,
      amount: parseUnits(amount, 18),
      expiresIn,
      encryptedMemo,
      stealthAddress: stealthAddress.spendingPublicKey,
    })

    // Generate payment link
    const link = `https://Shielded Ledger.app/pay/${requestId}`
    setPaymentLink(link)
  }

  return (
    <div className="space-y-6">
      <h2>Create Payment Request</h2>

      <div>
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div>
        <label>Currency</label>
        <select value={zkToken} onChange={(e) => setZkToken(e.target.value)}>
          <option value="zkPYUSD">zkPYUSD</option>
          <option value="zkUSDC">zkUSDC</option>
          <option value="zkUSDT">zkUSDT</option>
        </select>
      </div>

      <div>
        <label>Memo (optional)</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Payment for..."
        />
      </div>

      <div>
        <label>Expires in</label>
        <select value={expiresIn} onChange={(e) => setExpiresIn(Number(e.target.value))}>
          <option value={3600}>1 hour</option>
          <option value={86400}>24 hours</option>
          <option value={604800}>7 days</option>
        </select>
      </div>

      <button onClick={handleCreateRequest}>
        Create Payment Request
      </button>

      {paymentLink && (
        <div className="mt-6">
          <h3>Payment Request Created!</h3>
          <QRCodeSVG value={paymentLink} size={256} />
          <p>{paymentLink}</p>
          <button onClick={() => navigator.clipboard.writeText(paymentLink)}>
            Copy Link
          </button>
        </div>
      )}
    </div>
  )
}
```

#### 2. Pay Request UI

```typescript
// frontend/src/components/payments/PayRequest.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { usePaymentRequestManager } from '@/hooks/usePaymentRequestManager'
import { generateProof } from '@/lib/zkProof'
import { poseidonHash } from '@/lib/crypto'

export function PayRequest() {
  const { requestId } = useParams()
  const { getPaymentRequest, fulfillPaymentRequest } = usePaymentRequestManager()

  const [request, setRequest] = useState(null)
  const [isPaying, setIsPaying] = useState(false)

  useEffect(() => {
    loadRequest()
  }, [requestId])

  const loadRequest = async () => {
    const req = await getPaymentRequest(requestId)
    setRequest(req)
  }

  const handlePay = async () => {
    setIsPaying(true)

    try {
      // Select notes to spend
      const notes = await selectNotesForPayment(request.amount, request.zkToken)

      // Generate payment proof (using transfer circuit)
      const { proof } = await generatePaymentProof(notes, request)

      // Execute payment
      await fulfillPaymentRequest(requestId, proof)

      alert('Payment successful!')
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsPaying(false)
    }
  }

  if (!request) return <div>Loading...</div>

  if (request.isPaid) {
    return <div>This payment request has already been paid.</div>
  }

  if (new Date() > new Date(request.expiresAt * 1000)) {
    return <div>This payment request has expired.</div>
  }

  return (
    <div className="space-y-6">
      <h2>Payment Request</h2>

      <div className="bg-gray-100 p-6 rounded-lg">
        <div className="text-4xl font-bold">
          {formatAmount(request.amount)} {request.zkToken}
        </div>
        <div className="text-gray-600 mt-2">
          to {truncateAddress(request.payee)}
        </div>
      </div>

      {request.encryptedMemo && (
        <div>
          <label>Memo</label>
          <p>{decryptMemo(request.encryptedMemo)}</p>
        </div>
      )}

      <div className="text-sm text-gray-600">
        Expires: {new Date(request.expiresAt * 1000).toLocaleString()}
      </div>

      <button
        onClick={handlePay}
        disabled={isPaying}
        className="w-full bg-blue-600 text-white py-3 rounded-lg"
      >
        {isPaying ? 'Processing Payment...' : `Pay ${formatAmount(request.amount)} ${request.zkToken}`}
      </button>
    </div>
  )
}
```

#### 3. Recurring Payments UI

```typescript
// frontend/src/components/payments/RecurringPayments.tsx
'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useRecurringPaymentManager } from '@/hooks/useRecurringPaymentManager'

export function RecurringPayments() {
  const { address } = useAccount()
  const { createSubscription, getPayerSubscriptions } = useRecurringPaymentManager()

  const [payee, setPayee] = useState('')
  const [amount, setAmount] = useState('')
  const [interval, setInterval] = useState('monthly')
  const [subscriptions, setSubscriptions] = useState([])

  const handleCreateSubscription = async () => {
    const intervalSeconds = {
      weekly: 604800,
      monthly: 2592000,
      yearly: 31536000,
    }[interval]

    await createSubscription({
      payee,
      zkToken: 'zkPYUSD',
      amount: parseUnits(amount, 18),
      interval: intervalSeconds,
      duration: 0, // Indefinite
    })

    loadSubscriptions()
  }

  const loadSubscriptions = async () => {
    const subs = await getPayerSubscriptions(address)
    setSubscriptions(subs)
  }

  return (
    <div className="space-y-6">
      <h2>Recurring Payments</h2>

      <div className="space-y-4">
        <h3>Create New Subscription</h3>

        <input
          type="text"
          placeholder="Recipient address"
          value={payee}
          onChange={(e) => setPayee(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount per payment"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select value={interval} onChange={(e) => setInterval(e.target.value)}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <button onClick={handleCreateSubscription}>
          Create Subscription
        </button>
      </div>

      <div className="mt-8">
        <h3>Your Subscriptions</h3>
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="border p-4 rounded">
              <div>To: {truncateAddress(sub.payee)}</div>
              <div>Amount: {formatAmount(sub.amount)} {sub.zkToken}</div>
              <div>Frequency: {getIntervalLabel(sub.interval)}</div>
              <div>Status: {sub.isActive ? 'Active' : 'Paused'}</div>
              <button onClick={() => cancelSubscription(sub.id)}>
                Cancel
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### 4. QR Code Scanner

```typescript
// frontend/src/components/payments/QRScanner.tsx
'use client'

import { useState } from 'react'
import { QrReader } from 'react-qr-reader'
import { useRouter } from 'next/navigation'

export function QRScanner() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = (result) => {
    if (result) {
      // Extract payment request ID from URL
      const url = new URL(result.text)
      const requestId = url.pathname.split('/').pop()

      // Navigate to payment page
      router.push(`/pay/${requestId}`)
      setIsScanning(false)
    }
  }

  return (
    <div>
      <button onClick={() => setIsScanning(!isScanning)}>
        {isScanning ? 'Stop Scanning' : 'Scan QR Code'}
      </button>

      {isScanning && (
        <div className="mt-4">
          <QrReader
            onResult={handleScan}
            constraints={{ facingMode: 'environment' }}
            className="w-full max-w-md"
          />
        </div>
      )}
    </div>
  )
}
```

### Hooks

```typescript
// frontend/src/hooks/usePaymentRequestManager.ts
import { useContractWrite, useContractRead } from 'wagmi'
import { PAYMENT_REQUEST_MANAGER_ABI } from '@/contracts/abis'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'

export function usePaymentRequestManager() {
  const { write: createRequest } = useContractWrite({
    address: CONTRACT_ADDRESSES.PaymentRequestManager,
    abi: PAYMENT_REQUEST_MANAGER_ABI,
    functionName: 'createPaymentRequest',
  })

  const createPaymentRequest = async (params) => {
    const { zkToken, amount, expiresIn, encryptedMemo, stealthAddress } = params

    const tx = await createRequest({
      args: [zkToken, amount, expiresIn, encryptedMemo, stealthAddress],
    })

    return tx.hash
  }

  const { data: paymentRequest } = useContractRead({
    address: CONTRACT_ADDRESSES.PaymentRequestManager,
    abi: PAYMENT_REQUEST_MANAGER_ABI,
    functionName: 'getPaymentRequest',
  })

  return {
    createPaymentRequest,
    getPaymentRequest: (requestId) => paymentRequest(requestId),
  }
}
```

---

## Payment Features

### 1. Multi-Currency Support

**Contract Setup:**
```typescript
// Deploy multiple zkERC20 instances
const zkPYUSD = await deployZkERC20('zkPYUSD', 'zkPYUSD', PYUSD_ADDRESS)
const zkUSDC = await deployZkERC20('zkUSDC', 'zkUSDC', USDC_ADDRESS)
const zkUSDT = await deployZkERC20('zkUSDT', 'zkUSDT', USDT_ADDRESS)

// Register with CollateralManager
await collateralManager.registerZkToken(zkPYUSD.address, PYUSD_ADDRESS)
await collateralManager.registerZkToken(zkUSDC.address, USDC_ADDRESS)
await collateralManager.registerZkToken(zkUSDT.address, USDT_ADDRESS)
```

**Frontend Currency Selector:**
```typescript
const SUPPORTED_CURRENCIES = [
  {
    name: 'zkPYUSD',
    symbol: 'zkPYUSD',
    address: CONTRACT_ADDRESSES.zkPYUSD,
    underlyingToken: 'PYUSD',
    icon: '/icons/pyusd.svg',
  },
  {
    name: 'zkUSDC',
    symbol: 'zkUSDC',
    address: CONTRACT_ADDRESSES.zkUSDC,
    underlyingToken: 'USDC',
    icon: '/icons/usdc.svg',
  },
  {
    name: 'zkUSDT',
    symbol: 'zkUSDT',
    address: CONTRACT_ADDRESSES.zkUSDT,
    underlyingToken: 'USDT',
    icon: '/icons/usdt.svg',
  },
]
```

### 2. Split Payments

**Implementation:**
```typescript
// frontend/src/lib/splitPayment.ts
export async function splitPayment(
  totalAmount: bigint,
  recipients: { address: string; percentage: number }[]
) {
  // Calculate amounts for each recipient
  const splits = recipients.map((r) => ({
    address: r.address,
    amount: (totalAmount * BigInt(r.percentage)) / 100n,
  }))

  // Generate multiple payment proofs (one per recipient)
  for (const split of splits) {
    // Select notes to cover this split
    const notes = await selectNotesForPayment(split.amount)

    // Generate proof
    const proof = await generatePaymentProof(notes, split)

    // Execute payment
    await executePayment(split.address, split.amount, proof)
  }
}
```

### 3. Payment Notifications

**Backend Service:**
```typescript
// backend/src/services/notificationService.ts
import { createPublicClient } from 'viem'
import { sendPushNotification } from './pushService'
import { sendEmail } from './emailService'

export async function listenForPayments() {
  const client = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  })

  // Listen for PaymentRequestFulfilled events
  client.watchEvent({
    address: CONTRACT_ADDRESSES.PaymentRequestManager,
    event: parseAbiItem('event PaymentRequestFulfilled(bytes32 indexed requestId, bytes32 indexed commitment)'),
    onLogs: async (logs) => {
      for (const log of logs) {
        const { requestId, commitment } = log.args

        // Get payment request details
        const request = await getPaymentRequest(requestId)

        // Notify payee
        await sendPushNotification(request.payee, {
          title: 'Payment Received',
          body: `You received ${formatAmount(request.amount)} ${request.zkToken}`,
        })

        await sendEmail(request.payee, {
          subject: 'Payment Received',
          body: `You received a payment of ${formatAmount(request.amount)} ${request.zkToken}`,
        })
      }
    },
  })
}
```

### 4. Merchant Integration

**REST API:**
```typescript
// backend/src/api/merchant.ts
import express from 'express'
import { verifyApiKey } from './auth'

const router = express.Router()

// Create payment request (merchant endpoint)
router.post('/payment-request', verifyApiKey, async (req, res) => {
  const { amount, currency, orderId, metadata } = req.body
  const merchant = req.merchant

  // Create payment request on-chain
  const requestId = await createPaymentRequest({
    payee: merchant.address,
    zkToken: currency,
    amount,
    metadata: { orderId, ...metadata },
  })

  // Return payment link
  res.json({
    requestId,
    paymentUrl: `https://Shielded Ledger.app/pay/${requestId}`,
    expiresAt: Date.now() + 3600000, // 1 hour
  })
})

// Check payment status
router.get('/payment/:requestId', verifyApiKey, async (req, res) => {
  const { requestId } = req.params

  const request = await getPaymentRequest(requestId)

  res.json({
    requestId,
    status: request.isPaid ? 'paid' : 'pending',
    amount: request.amount,
    currency: request.zkToken,
    paidAt: request.isPaid ? request.paidAt : null,
  })
})

// Webhooks (notify merchant when payment received)
router.post('/webhook', async (req, res) => {
  const { event, data } = req.body

  if (event === 'payment.completed') {
    const merchant = await getMerchant(data.merchantAddress)

    // Send webhook to merchant's URL
    await fetch(merchant.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'payment.completed',
        paymentId: data.paymentId,
        amount: data.amount,
        currency: data.currency,
        orderId: data.metadata.orderId,
      }),
    })
  }

  res.json({ success: true })
})

export default router
```

---

## Deployment Guide

### Step 1: Deploy DiffiChain Base

```bash
cd contracts

# Set environment variables
cat > .env << EOF
PRIVATE_KEY=your_deployer_private_key
PYUSD_ADDRESS=0x...  # PYUSD on Monad testnet
USDC_ADDRESS=0x...   # USDC on Monad testnet
USDT_ADDRESS=0x...   # USDT on Monad testnet
PYTH_CONTRACT=0x2880aB155794e7179c9eE2e38200202908C17B43
EOF

# Deploy base contracts
forge script script/DeployBase.s.sol --rpc-url monad_testnet --broadcast --verify
```

### Step 2: Deploy Shielded Ledger Extensions

```bash
# Deploy payment extensions
forge script script/DeployPaymentExtensions.s.sol --rpc-url monad_testnet --broadcast --verify
```

**DeployPaymentExtensions.s.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {PaymentRequestManager} from "../src/payments/PaymentRequestManager.sol";
import {RecurringPaymentManager} from "../src/payments/RecurringPaymentManager.sol";
import {AtomicSwap} from "../src/payments/AtomicSwap.sol";
import {MerchantGateway} from "../src/payments/MerchantGateway.sol";

contract DeployPaymentExtensions is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy payment contracts
        PaymentRequestManager paymentRequestManager = new PaymentRequestManager();
        RecurringPaymentManager recurringPaymentManager = new RecurringPaymentManager();
        AtomicSwap atomicSwap = new AtomicSwap(SWAP_VERIFIER_ADDRESS);
        MerchantGateway merchantGateway = new MerchantGateway();

        vm.stopBroadcast();

        // Log addresses
        console.log("PaymentRequestManager:", address(paymentRequestManager));
        console.log("RecurringPaymentManager:", address(recurringPaymentManager));
        console.log("AtomicSwap:", address(atomicSwap));
        console.log("MerchantGateway:", address(merchantGateway));
    }
}
```

### Step 3: Deploy Multiple zkTokens

```bash
# Deploy zkPYUSD
forge script script/DeployZkToken.s.sol:DeployZkPYUSD --rpc-url monad_testnet --broadcast

# Deploy zkUSDC
forge script script/DeployZkToken.s.sol:DeployZkUSDC --rpc-url monad_testnet --broadcast

# Deploy zkUSDT
forge script script/DeployZkToken.s.sol:DeployZkUSDT --rpc-url monad_testnet --broadcast
```

### Step 4: Setup Backend Services

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cat > .env << EOF
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CONTRACT_ADDRESSES_JSON=./contracts.json
NOTIFICATION_API_KEY=...
EMAIL_API_KEY=...
PORT=3000
EOF

# Run migrations
npx prisma migrate deploy

# Start services
npm run start
```

### Step 5: Deploy Frontend

```bash
cd frontend

# Build production bundle
npm run build

# Deploy to Vercel
vercel deploy --prod

# Or deploy to custom server
pm2 start npm --name "Shielded Ledger" -- start
```

---

## Testing Strategy

### Unit Tests

```typescript
// contracts/test/PaymentRequestManager.t.sol
import {Test} from "forge-std/Test.sol";
import {PaymentRequestManager} from "../src/payments/PaymentRequestManager.sol";

contract PaymentRequestManagerTest is Test {
    PaymentRequestManager public manager;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        manager = new PaymentRequestManager();
    }

    function testCreatePaymentRequest() public {
        vm.prank(alice);
        bytes32 requestId = manager.createPaymentRequest(
            address(zkPYUSD),
            100 ether,
            3600,
            hex"deadbeef",
            hex"1234"
        );

        PaymentRequestManager.PaymentRequest memory request = manager.getPaymentRequest(requestId);

        assertEq(request.payee, alice);
        assertEq(request.amount, 100 ether);
        assertFalse(request.isPaid);
    }

    function testFulfillPaymentRequest() public {
        // Create request
        vm.prank(alice);
        bytes32 requestId = manager.createPaymentRequest(...);

        // Fulfill payment
        bytes32 commitment = keccak256("commitment");
        manager.fulfillPaymentRequest(requestId, commitment);

        // Verify
        PaymentRequestManager.PaymentRequest memory request = manager.getPaymentRequest(requestId);
        assertTrue(request.isPaid);
        assertEq(request.commitment, commitment);
    }
}
```

### Integration Tests

```typescript
// frontend/tests/integration/payment.test.ts
import { test, expect } from '@playwright/test'

test('complete payment flow', async ({ page }) => {
  // 1. Create payment request
  await page.goto('/request')
  await page.fill('[name="amount"]', '100')
  await page.selectOption('[name="currency"]', 'zkPYUSD')
  await page.click('button:has-text("Create Request")')

  // 2. Get payment link
  const link = await page.locator('.payment-link').textContent()

  // 3. Pay request (in new context as different user)
  const payPage = await page.context().newPage()
  await payPage.goto(link)
  await payPage.click('button:has-text("Pay")')

  // 4. Verify payment success
  await expect(payPage.locator('text=Payment successful')).toBeVisible()
})
```

---

## Security Considerations

### 1. Payment Request Security

**Expiration Enforcement:**
```solidity
modifier notExpired(bytes32 requestId) {
    if (block.timestamp > paymentRequests[requestId].expiresAt) {
        revert PaymentRequestExpired();
    }
    _;
}
```

**Replay Protection:**
```solidity
function fulfillPaymentRequest(bytes32 requestId, bytes32 commitment) external {
    if (paymentRequests[requestId].isPaid) {
        revert PaymentAlreadyFulfilled();
    }
    // Process payment...
}
```

### 2. Recurring Payment Security

**Authorization Checks:**
```solidity
function cancelSubscription(bytes32 subscriptionId) external {
    RecurringPayment storage sub = subscriptions[subscriptionId];

    // Only payer or payee can cancel
    require(
        msg.sender == sub.payer || msg.sender == sub.payee,
        "Unauthorized"
    );

    sub.isActive = false;
}
```

**Payment Frequency Enforcement:**
```solidity
function executePayment(bytes32 subscriptionId) external {
    RecurringPayment storage sub = subscriptions[subscriptionId];

    uint256 nextDue = sub.lastPaymentTime + sub.interval;
    require(block.timestamp >= nextDue, "Payment not yet due");

    // Process payment...
}
```

### 3. Atomic Swap Security

**Escrow Mechanism:**
- Maker locks funds in contract
- Taker can only claim if they provide matching funds
- ZK proof ensures fair exchange

**Timeout Protection:**
```solidity
function claimEscrow(bytes32 swapId) external {
    SwapOffer storage offer = swapOffers[swapId];

    // Allow maker to reclaim after expiry
    require(block.timestamp > offer.expiresAt, "Not expired");
    require(msg.sender == offer.maker, "Not maker");
    require(!offer.isCompleted, "Already completed");

    // Return escrowed funds
    offer.isActive = false;
}
```

### 4. Merchant Gateway Security

**API Key Management:**
```typescript
// Use hashed API keys (never store plaintext)
const apiKeyHash = keccak256(apiKey)
merchants[merchant].apiKeyHash = apiKeyHash

// Verify requests
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']
  const hash = keccak256(apiKey)

  if (merchants[merchant].apiKeyHash !== hash) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  next()
}
```

**Rate Limiting:**
```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each merchant to 100 requests per window
  keyGenerator: (req) => req.merchant.address,
})

app.use('/api/merchant/', limiter)
```

---

## User Flows

### Flow 1: Convert PYUSD to zkPYUSD

```
1. User connects wallet
2. User selects "Deposit" → "zkPYUSD"
3. User enters amount (e.g., 1000 PYUSD)
4. Frontend generates ZK proof (5-10 seconds)
5. User approves PYUSD spending
6. User confirms deposit transaction
7. Contract verifies proof, locks PYUSD in CollateralManager
8. User receives zkPYUSD notes (stored in IndexedDB)
9. Balance updates in UI
```

### Flow 2: Pay a Friend

```
1. Friend creates payment request
   - Enters amount: 50 zkPYUSD
   - Adds memo: "Dinner split"
   - Gets payment link + QR code

2. User scans QR code or clicks link
3. Payment page shows:
   - Amount: 50 zkPYUSD
   - To: Friend's address
   - Memo: "Dinner split"

4. User clicks "Pay"
5. Frontend:
   - Selects notes totaling ≥50 zkPYUSD
   - Generates payment proof (15-30 seconds)
   - Creates output note for friend (stealth address)
   - Creates change note if needed

6. Transaction submitted
7. Friend receives notification
8. Payment marked as complete
```

### Flow 3: Subscribe to Service

```
1. User navigates to "Subscriptions"
2. Clicks "New Subscription"
3. Enters details:
   - Recipient: streaming-service.eth
   - Amount: 10 zkPYUSD
   - Frequency: Monthly
   - Duration: 12 months

4. User confirms subscription
5. Backend service monitors subscription
6. Every month:
   - Backend checks if payment due
   - Generates payment proof
   - Executes transfer
   - Notifies both parties

7. User can pause/cancel anytime
```

### Flow 4: Merchant Payment

```
1. Customer shops at online store
2. Checkout: Total $100
3. Customer selects "Pay with Shielded Ledger"
4. Store calls Merchant API:
   POST /api/payment-request
   {
     "amount": 100,
     "currency": "zkUSDC",
     "orderId": "ORDER-123"
   }

5. API returns payment URL
6. Customer redirected to Shielded Ledger
7. Customer pays with zkUSDC
8. Store receives webhook:
   {
     "event": "payment.completed",
     "orderId": "ORDER-123",
     "amount": 100
   }

9. Store fulfills order
10. Customer receives confirmation
```

### Flow 5: Atomic Swap

```
1. User has zkPYUSD, wants zkUSDC
2. User creates swap offer:
   - Offering: 1000 zkPYUSD
   - Wanting: 1000 zkUSDC
   - Expires: 1 hour

3. Swap listed in marketplace
4. Another user accepts swap
5. Both generate swap proofs
6. Contract verifies:
   - Both have required notes
   - Amounts match
   - Proofs valid

7. Atomic execution:
   - User1's zkPYUSD → User2
   - User2's zkUSDC → User1

8. Both receive new notes
9. Swap marked complete
```

---

## Next Steps

### Phase 1: Foundation (Weeks 1-4)
- ✅ Review DiffiChain base contracts
- ✅ Understand ZK circuits
- 🔲 Deploy test environment
- 🔲 Test base functionality

### Phase 2: Payment Extensions (Weeks 5-8)
- 🔲 Implement PaymentRequestManager
- 🔲 Implement RecurringPaymentManager
- 🔲 Implement AtomicSwap
- 🔲 Implement MerchantGateway
- 🔲 Write comprehensive tests

### Phase 3: Frontend Development (Weeks 9-12)
- 🔲 Payment request UI
- 🔲 QR code scanning
- 🔲 Recurring payments dashboard
- 🔲 Merchant integration page
- 🔲 Mobile-responsive design

### Phase 4: Backend Services (Weeks 13-14)
- 🔲 Notification service
- 🔲 Payment monitoring
- 🔲 Webhook system
- 🔲 Merchant API

### Phase 5: Testing & Security (Weeks 15-16)
- 🔲 Security audit
- 🔲 Load testing
- 🔲 User acceptance testing
- 🔲 Bug fixes

### Phase 6: Launch (Week 17+)
- 🔲 Mainnet deployment
- 🔲 Documentation
- 🔲 Marketing materials
- 🔲 Community launch

---

## Conclusion

Shielded Ledger extends DiffiChain's privacy infrastructure to create a complete payment system with:

- **Privacy-First**: All transaction details hidden via ZK proofs
- **User-Friendly**: QR codes, payment links, simple UX
- **Feature-Rich**: Requests, subscriptions, swaps, merchant tools
- **Secure**: Battle-tested cryptography, comprehensive testing
- **Scalable**: Modular architecture, extensible design

By building on DiffiChain's foundation and adding payment-specific features, Shielded Ledger provides a privacy-preserving alternative to traditional payment systems while maintaining the security and decentralization of blockchain technology.

**Start building today!** 🚀
