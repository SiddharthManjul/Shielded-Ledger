// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IzkERC20} from "../interfaces/IzkERC20.sol";
import {IGroth16Verifier} from "../interfaces/IGroth16Verifier.sol";
import {ICollateralManager} from "../interfaces/ICollateralManager.sol";
import {MerkleTree} from "../libraries/MerkleTree.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract zkERC20 is IzkERC20, Ownable, ReentrancyGuard {

    using MerkleTree for MerkleTree.Tree;

    IGroth16Verifier public immutable DEPOSIT_VERIFIER;
    IGroth16Verifier public immutable TRANSFER_VERIFIER;
    IGroth16Verifier public immutable WITHDRAW_VERIFIER;

    ICollateralManager public immutable COLLATERAL_MANAGER;

    MerkleTree.Tree private commitmentTree;

    mapping(bytes32 => bool) public nullifiers;
    mapping(bytes32 => uint256) public commitmentIndex;

    string public name;
    string public symbol;

    uint256 public immutable DENOMINATION;

    error InvalidProof();
    error NullifierAlreadySpent();
    error InvalidMerkleRoot();
    error CommitmentAlreadyExists();
    error InvalidCommitment();
    error InvalidArrayLength();
    error TransferFailed();

    constructor(
        string memory _name,
        string memory _symbol,
        address _depositVerifier,
        address _transferVerifier,
        address _withdrawVerifier,
        address _collateralManager,
        uint256 _denomination
    ) Ownable(msg.sender) {
        name = _name;
        symbol = _symbol;
        DEPOSIT_VERIFIER = IGroth16Verifier(_depositVerifier);
        TRANSFER_VERIFIER = IGroth16Verifier(_transferVerifier);
        WITHDRAW_VERIFIER = IGroth16Verifier(_withdrawVerifier);
        COLLATERAL_MANAGER = ICollateralManager(_collateralManager);
        DENOMINATION = _denomination;
        commitmentTree.initialize();
    }

    function deposit(
        uint256 amount,
        bytes32 commitment,
        bytes32 nullifierHash,
        bytes calldata encryptedNote,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external nonReentrant {
        if (_commitmentExists(commitment)) {
            revert CommitmentAlreadyExists();
        }
        if (nullifiers[nullifierHash]) {
            revert NullifierAlreadySpent();
        }

        uint256[] memory publicInputs = new uint256[](2);
        publicInputs[0] = uint256(commitment);
        publicInputs[1] = uint256(nullifierHash);

        bool proofValid = DEPOSIT_VERIFIER.verifyProof(proofA, proofB, proofC, publicInputs);
        if (!proofValid) {
            revert InvalidProof();
        }

        address underlyingToken = COLLATERAL_MANAGER.getUnderlyingToken(address(this));
        require(IERC20(underlyingToken).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        IERC20(underlyingToken).approve(address(COLLATERAL_MANAGER), amount);

        bool locked = COLLATERAL_MANAGER.lockCollateral(address(this), amount, commitment);
        if (!locked) {
            revert TransferFailed();
        }

        nullifiers[nullifierHash] = true;

        uint256 index = commitmentTree.insert(commitment);
        commitmentIndex[commitment] = index;

        emit NoteCommitted(commitment, index, encryptedNote);
        emit Deposit(commitment);
    }

    function transfer(
        bytes32[2] calldata inputNullifiers,
        bytes32[2] calldata outputCommitments,
        bytes32 merkleRoot,
        bytes[] calldata encryptedNotes,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external nonReentrant {
        _validateTransferInputs(inputNullifiers, outputCommitments, encryptedNotes, merkleRoot);

        _verifyTransferProof(inputNullifiers, outputCommitments, merkleRoot, proofA, proofB, proofC);

        _processTransfer(inputNullifiers, outputCommitments, encryptedNotes);
    }

    function _validateTransferInputs(
        bytes32[2] calldata inputNullifiers,
        bytes32[2] calldata outputCommitments,
        bytes[] calldata encryptedNotes,
        bytes32 merkleRoot
    ) private view {
        if (encryptedNotes.length != 2) {
            revert InvalidArrayLength();
        }

        if (nullifiers[inputNullifiers[0]] || nullifiers[inputNullifiers[1]]) {
            revert NullifierAlreadySpent();
        }

        if (_commitmentExists(outputCommitments[0]) || _commitmentExists(outputCommitments[1])) {
            revert CommitmentAlreadyExists();
        }

        if (merkleRoot != commitmentTree.root) {
            revert InvalidMerkleRoot();
        }
    }

    function _verifyTransferProof(
        bytes32[2] calldata inputNullifiers,
        bytes32[2] calldata outputCommitments,
        bytes32 merkleRoot,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) private view {
        uint256[] memory publicInputs = new uint256[](5);
        publicInputs[0] = uint256(merkleRoot);
        publicInputs[1] = uint256(inputNullifiers[0]);
        publicInputs[2] = uint256(inputNullifiers[1]);
        publicInputs[3] = uint256(outputCommitments[0]);
        publicInputs[4] = uint256(outputCommitments[1]);

        if (!TRANSFER_VERIFIER.verifyProof(proofA, proofB, proofC, publicInputs)) {
            revert InvalidProof();
        }
    }

    function _processTransfer(
        bytes32[2] calldata inputNullifiers,
        bytes32[2] calldata outputCommitments,
        bytes[] calldata encryptedNotes
    ) private {
        nullifiers[inputNullifiers[0]] = true;
        nullifiers[inputNullifiers[1]] = true;
        emit NullifierSpent(inputNullifiers[0]);
        emit NullifierSpent(inputNullifiers[1]);

        uint256 index0 = commitmentTree.insert(outputCommitments[0]);
        commitmentIndex[outputCommitments[0]] = index0;
        emit NoteCommitted(outputCommitments[0], index0, encryptedNotes[0]);

        uint256 index1 = commitmentTree.insert(outputCommitments[1]);
        commitmentIndex[outputCommitments[1]] = index1;
        emit NoteCommitted(outputCommitments[1], index1, encryptedNotes[1]);
    }

    function withdraw(
        uint256 amount,
        address recipient,
        bytes32 commitment,
        bytes32 nullifierHash,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external nonReentrant {
        if (nullifiers[nullifierHash]) {
            revert NullifierAlreadySpent();
        }

        uint256[] memory publicInputs = new uint256[](5);
        publicInputs[0] = uint256(commitmentTree.root);
        publicInputs[1] = amount;
        publicInputs[2] = uint256(uint160(recipient));
        publicInputs[3] = uint256(commitment);
        publicInputs[4] = uint256(nullifierHash);

        bool proofValid = WITHDRAW_VERIFIER.verifyProof(proofA, proofB, proofC, publicInputs);
        if (!proofValid) {
            revert InvalidProof();
        }

        nullifiers[nullifierHash] = true;
        emit NullifierSpent(nullifierHash);
        emit Withdrawal(nullifierHash);

        bool released = COLLATERAL_MANAGER.releaseCollateral(
            address(this),
            recipient,
            amount,
            nullifierHash
        );
        if (!released) {
            revert TransferFailed();
        }
    }

    function commitmentExists(bytes32 commitment) external view override returns (bool) {
        return _commitmentExists(commitment);
    }

    function _commitmentExists(bytes32 commitment) private view returns (bool) {
        uint256 index = commitmentIndex[commitment];
        return index > 0 || (commitment == commitmentTree.leaves[0] && commitmentTree.nextIndex > 0);
    }

    function isNullifierSpent(bytes32 nullifier) external view override returns (bool) {
        return nullifiers[nullifier];
    }

    function getMerkleRoot() external view override returns (bytes32) {
        return commitmentTree.getRoot();
    }

    function getNextIndex() external view override returns (uint256) {
        return commitmentTree.getNextIndex();
    }

}