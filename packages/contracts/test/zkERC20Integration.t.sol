// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {zkERC20} from "../src/core/zkERC20.sol";
import {CollateralManager} from "../src/core/CollateralManager.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockGroth16Verifier} from "./mocks/MockGroth16Verifier.sol";

contract zkERC20IntegrationTest is Test {
    zkERC20 public zkToken;
    CollateralManager public collateralManager;
    MockERC20 public underlyingToken;

    address public depositVerifier;
    address public transferVerifier;
    address public withdrawVerifier;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    uint256 constant INITIAL_BALANCE = 1000 ether;

    function setUp() public {
        underlyingToken = new MockERC20("Test Token", "TEST");

        MockGroth16Verifier depositVerifierContract = new MockGroth16Verifier();
        MockGroth16Verifier transferVerifierContract = new MockGroth16Verifier();
        MockGroth16Verifier withdrawVerifierContract = new MockGroth16Verifier();

        depositVerifier = address(depositVerifierContract);
        transferVerifier = address(transferVerifierContract);
        withdrawVerifier = address(withdrawVerifierContract);

        collateralManager = new CollateralManager(address(0));

        zkToken = new zkERC20(
            "zkTest",
            "zkTEST",
            depositVerifier,
            transferVerifier,
            withdrawVerifier,
            address(collateralManager),
            0 
        );

        collateralManager.registerZkToken(address(zkToken), address(underlyingToken));

        underlyingToken.mint(alice, INITIAL_BALANCE);
        underlyingToken.mint(bob, INITIAL_BALANCE);
        underlyingToken.mint(charlie, INITIAL_BALANCE);

        vm.prank(alice);
        underlyingToken.approve(address(zkToken), type(uint256).max);
        vm.prank(bob);
        underlyingToken.approve(address(zkToken), type(uint256).max);
        vm.prank(charlie);
        underlyingToken.approve(address(zkToken), type(uint256).max);
    }

    function testDeposit() public {
        uint256 amount = 100 ether;
        bytes32 commitment = keccak256(abi.encodePacked(amount, "secret1", "nullifier1"));
        bytes32 nullifierHash = keccak256(abi.encodePacked("nullifier1"));

        uint256[2] memory proofA = [uint256(1), uint256(2)];
        uint256[2][2] memory proofB = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory proofC = [uint256(7), uint256(8)];

        uint256 aliceBalanceBefore = underlyingToken.balanceOf(alice);

        vm.prank(alice);
        zkToken.deposit(amount, commitment, nullifierHash, hex"deadbeef", proofA, proofB, proofC);

        assertTrue(zkToken.commitmentExists(commitment));

        assertTrue(zkToken.isNullifierSpent(nullifierHash));

        assertEq(underlyingToken.balanceOf(alice), aliceBalanceBefore - amount);
        assertEq(underlyingToken.balanceOf(address(collateralManager)), amount);

        assertEq(zkToken.getNextIndex(), 1);
    }

    function testTransfer() public {
        uint256 amount1 = 50 ether;
        uint256 amount2 = 30 ether;

        bytes32 commitment1 = keccak256(abi.encodePacked(amount1, "secret1", "nullifier1"));
        bytes32 nullifierHash1 = keccak256(abi.encodePacked("nullifier1"));

        bytes32 commitment2 = keccak256(abi.encodePacked(amount2, "secret2", "nullifier2"));
        bytes32 nullifierHash2 = keccak256(abi.encodePacked("nullifier2"));

        uint256[2] memory proofA = [uint256(1), uint256(2)];
        uint256[2][2] memory proofB = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory proofC = [uint256(7), uint256(8)];

        vm.prank(alice);
        zkToken.deposit(amount1, commitment1, nullifierHash1, hex"", proofA, proofB, proofC);

        vm.prank(alice);
        zkToken.deposit(amount2, commitment2, nullifierHash2, hex"", proofA, proofB, proofC);

        bytes32 inputNullifier1 = keccak256(abi.encodePacked("spend_nullifier1"));
        bytes32 inputNullifier2 = keccak256(abi.encodePacked("spend_nullifier2"));

        bytes32 outputCommitment1 = keccak256(abi.encodePacked(uint256(40 ether), "secret3", "nullifier3"));
        bytes32 outputCommitment2 = keccak256(abi.encodePacked(uint256(40 ether), "secret4", "nullifier4"));

        bytes32 merkleRoot = zkToken.getMerkleRoot();

        bytes[] memory encryptedNotes = new bytes[](2);
        encryptedNotes[0] = hex"dead";
        encryptedNotes[1] = hex"beef";

        vm.prank(alice);
        zkToken.transfer(
            [inputNullifier1, inputNullifier2],
            [outputCommitment1, outputCommitment2],
            merkleRoot,
            encryptedNotes,
            proofA,
            proofB,
            proofC
        );

        assertTrue(zkToken.isNullifierSpent(inputNullifier1));
        assertTrue(zkToken.isNullifierSpent(inputNullifier2));

        assertTrue(zkToken.commitmentExists(outputCommitment1));
        assertTrue(zkToken.commitmentExists(outputCommitment2));

        assertEq(zkToken.getNextIndex(), 4);
    }

    function testWithdraw() public {
        uint256 depositAmount = 75 ether;
        bytes32 commitment = keccak256(abi.encodePacked(depositAmount, "secret1", "nullifier1"));
        bytes32 depositNullifierHash = keccak256(abi.encodePacked("nullifier1"));

        uint256[2] memory proofA = [uint256(1), uint256(2)];
        uint256[2][2] memory proofB = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory proofC = [uint256(7), uint256(8)];

        vm.prank(alice);
        zkToken.deposit(depositAmount, commitment, depositNullifierHash, hex"", proofA, proofB, proofC);

        uint256 withdrawAmount = 75 ether;
        bytes32 withdrawNullifierHash = keccak256(abi.encodePacked("withdraw_nullifier1"));

        uint256 bobBalanceBefore = underlyingToken.balanceOf(bob);

        vm.prank(alice);
        zkToken.withdraw(
            withdrawAmount,
            bob,
            commitment,
            withdrawNullifierHash,
            proofA,
            proofB,
            proofC
        );

        assertTrue(zkToken.isNullifierSpent(withdrawNullifierHash));

        assertEq(underlyingToken.balanceOf(bob), bobBalanceBefore + withdrawAmount);
    }

    function testCannotDepositDuplicateCommitment() public {
        uint256 amount = 50 ether;
        bytes32 commitment = keccak256(abi.encodePacked(amount, "secret1", "nullifier1"));
        bytes32 nullifierHash = keccak256(abi.encodePacked("nullifier1"));

        uint256[2] memory proofA = [uint256(1), uint256(2)];
        uint256[2][2] memory proofB = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory proofC = [uint256(7), uint256(8)];

        vm.prank(alice);
        zkToken.deposit(amount, commitment, nullifierHash, hex"", proofA, proofB, proofC);

        bytes32 nullifierHash2 = keccak256(abi.encodePacked("nullifier2"));

        vm.expectRevert(zkERC20.CommitmentAlreadyExists.selector);
        vm.prank(alice);
        zkToken.deposit(amount, commitment, nullifierHash2, hex"", proofA, proofB, proofC);
    }

    function testCannotReuseNullifier() public {
        uint256 amount = 50 ether;
        bytes32 commitment1 = keccak256(abi.encodePacked(amount, "secret1", "nullifier1"));
        bytes32 commitment2 = keccak256(abi.encodePacked(amount, "secret2", "nullifier2"));
        bytes32 nullifierHash = keccak256(abi.encodePacked("nullifier1"));

        uint256[2] memory proofA = [uint256(1), uint256(2)];
        uint256[2][2] memory proofB = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory proofC = [uint256(7), uint256(8)];

        vm.prank(alice);
        zkToken.deposit(amount, commitment1, nullifierHash, hex"", proofA, proofB, proofC);

        vm.expectRevert(zkERC20.NullifierAlreadySpent.selector);
        vm.prank(alice);
        zkToken.deposit(amount, commitment2, nullifierHash, hex"", proofA, proofB, proofC);
    }

    function testCannotTransferWithInvalidMerkleRoot() public {
        uint256 amount = 50 ether;
        bytes32 commitment = keccak256(abi.encodePacked(amount, "secret1", "nullifier1"));
        bytes32 nullifierHash = keccak256(abi.encodePacked("nullifier1"));

        uint256[2] memory proofA = [uint256(1), uint256(2)];
        uint256[2][2] memory proofB = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory proofC = [uint256(7), uint256(8)];

        vm.prank(alice);
        zkToken.deposit(amount, commitment, nullifierHash, hex"", proofA, proofB, proofC);

        bytes32 invalidRoot = bytes32(uint256(12345));
        bytes32[] memory inputNulls = new bytes32[](2);
        inputNulls[0] = keccak256("null1");
        inputNulls[1] = keccak256("null2");

        bytes32[2] memory inputNullifiers = [keccak256("null1"), keccak256("null2")];
        bytes32[2] memory outputCommitments = [
            keccak256(abi.encodePacked(uint256(25 ether), "s3", "n3")),
            keccak256(abi.encodePacked(uint256(25 ether), "s4", "n4"))
        ];

        bytes[] memory encryptedNotes = new bytes[](2);
        encryptedNotes[0] = hex"01";
        encryptedNotes[1] = hex"02";

        vm.expectRevert(zkERC20.InvalidMerkleRoot.selector);
        vm.prank(alice);
        zkToken.transfer(inputNullifiers, outputCommitments, invalidRoot, encryptedNotes, proofA, proofB, proofC);
    }

    function testCompleteFlow() public {
        uint256[2] memory proofA = [uint256(1), uint256(2)];
        uint256[2][2] memory proofB = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory proofC = [uint256(7), uint256(8)];

        uint256 aliceDeposit = 100 ether;
        bytes32 aliceCommitment = keccak256(abi.encodePacked(aliceDeposit, "alice_secret", "alice_null"));
        bytes32 aliceNullifierHash = keccak256(abi.encodePacked("alice_null"));

        vm.prank(alice);
        zkToken.deposit(aliceDeposit, aliceCommitment, aliceNullifierHash, hex"deadbeef", proofA, proofB, proofC);

        console.log("Step 1: Alice deposited", aliceDeposit);
        console.log("  - Merkle index:", zkToken.getNextIndex());

        uint256 bobDeposit = 50 ether;
        bytes32 bobCommitment = keccak256(abi.encodePacked(bobDeposit, "bob_secret", "bob_null"));
        bytes32 bobNullifierHash = keccak256(abi.encodePacked("bob_null"));

        vm.prank(bob);
        zkToken.deposit(bobDeposit, bobCommitment, bobNullifierHash, hex"deadbeef", proofA, proofB, proofC);

        console.log("Step 2: Bob deposited", bobDeposit);
        console.log("  - Merkle index:", zkToken.getNextIndex());

        bytes32 merkleRoot = zkToken.getMerkleRoot();
        bytes32[2] memory inputNullifiers = [
            keccak256("alice_transfer_null"),
            keccak256("bob_transfer_null")
        ];
        bytes32[2] memory outputCommitments = [
            keccak256(abi.encodePacked(uint256(75 ether), "out1_secret", "out1_null")),
            keccak256(abi.encodePacked(uint256(75 ether), "out2_secret", "out2_null"))
        ];

        bytes[] memory encryptedNotes = new bytes[](2);
        encryptedNotes[0] = hex"aaaa";
        encryptedNotes[1] = hex"bbbb";

        vm.prank(alice);
        zkToken.transfer(inputNullifiers, outputCommitments, merkleRoot, encryptedNotes, proofA, proofB, proofC);

        console.log("Step 3: Transfer completed (2-in, 2-out)");
        console.log("  - Total commitments:", zkToken.getNextIndex());

        uint256 withdrawAmount = 75 ether;
        bytes32 withdrawNullifierHash = keccak256("withdraw_null");

        uint256 charlieBalanceBefore = underlyingToken.balanceOf(charlie);

        vm.prank(alice);
        zkToken.withdraw(
            withdrawAmount,
            charlie,
            outputCommitments[0],
            withdrawNullifierHash,
            proofA,
            proofB,
            proofC
        );

        console.log("Step 4: Withdrawn to Charlie:", withdrawAmount);
        console.log("  - Charlie's new balance:", underlyingToken.balanceOf(charlie));

        assertEq(underlyingToken.balanceOf(charlie), charlieBalanceBefore + withdrawAmount);
        assertTrue(zkToken.isNullifierSpent(inputNullifiers[0]));
        assertTrue(zkToken.isNullifierSpent(inputNullifiers[1]));
        assertTrue(zkToken.isNullifierSpent(withdrawNullifierHash));
    }
}