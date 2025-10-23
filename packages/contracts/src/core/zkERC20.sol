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

    IGroth16Verifier public immutable depositVerifier;
    IGroth16Verifier public immutable transferVerifier;
    IGroth16Verifier public immutable withdrawVerifier;
    ICollateralManager public immutable collateralManager;
    MerkleTree.Tree private commitmentTree;
    mapping(bytes32 => bool) public nullifiers;
    mapping(bytes32 => uint256) public commitmentIndex;

    string public name;
    string public symbol;
    uint256 public immutable denomination;

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
        depositVerifier = IGroth16Verifier(_depositVerifier);
        transferVerifier = IGroth16Verifier(_transferVerifier);
        withdrawVerifier = IGroth16Verifier(_withdrawVerifier);
        collateralManager = ICollateralManager(_collateralManager);
        denomination = _denomination;
        commitmentTree.initialize();
    }

    function deposit(
        bytes32 commitment,
        bytes calldata encryptedNote,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external override nonReentrant {
        if (_commitmentExists(commitment)) {
            revert CommitmentAlreadyExists();
        }

        uint256[] memory publicInputs = new uint256[](denomination > 0 ? 2 : 1);
        publicInputs[0] = uint256(commitment);
        if (denomination > 0) {
            publicInputs[1] = denomination;
        }

        bool proofValid = depositVerifier.verifyProof(proofA, proofB, proofC, publicInputs);
        if (!proofValid) {
            revert InvalidProof();
        }

        uint256 amountToLock = denomination > 0 ? denomination : _extractAmountFromProof(publicInputs);

        address underlyingToken = collateralManager.getUnderlyingToken(address(this));
        IERC20(underlyingToken).transferFrom(msg.sender, address(this), amountToLock);
        IERC20(underlyingToken).approve(address(collateralManager), amountToLock);

        bool locked = collateralManager.lockCollateral(address(this), amountToLock, commitment);
        if (!locked) {
            revert TransferFailed();
        }

        uint256 index = commitmentTree.insert(commitment);
        commitmentIndex[commitment] = index;

        emit NoteCommitted(commitment, index, encryptedNote);
        emit Deposit(commitment);
    }

    function transfer(
        bytes32[] calldata inputNullifiers,
        bytes32[] calldata outputCommitments,
        bytes32 merkleRoot,
        bytes[] calldata encryptedNotes,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external override nonReentrant {
        _validateTransferInputs(inputNullifiers, outputCommitments, encryptedNotes, merkleRoot);

        _verifyTransferProof(inputNullifiers, outputCommitments, merkleRoot, proofA, proofB, proofC);

        _processTransfer(inputNullifiers, outputCommitments, encryptedNotes);
    }

    function _validateTransferInputs(
        bytes32[] calldata inputNullifiers,
        bytes32[] calldata outputCommitments,
        bytes[] calldata encryptedNotes,
        bytes32 merkleRoot
    ) private view {
        if (inputNullifiers.length == 0 || outputCommitments.length == 0) {
            revert InvalidArrayLength();
        }
        if (encryptedNotes.length != outputCommitments.length) {
            revert InvalidArrayLength();
        }

        for (uint256 i; i < inputNullifiers.length;) {
            if (nullifiers[inputNullifiers[i]]) {
                revert NullifierAlreadySpent();
            }
            unchecked {
                ++i;
            }
        }

        for (uint256 i; i < outputCommitments.length;) {
            if (_commitmentExists(outputCommitments[i])) {
                revert CommitmentAlreadyExists();
            }
            unchecked {
                ++i;
            }
        }

        if (merkleRoot != commitmentTree.root) {
            revert InvalidMerkleRoot();
        }
    }

    function _verifyTransferProof(
        bytes32[] calldata inputNullifiers,
        bytes32[] calldata outputCommitments,
        bytes32 merkleRoot,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) private view {
        uint256[] memory publicInputs = _buildTransferPublicInputs(
            inputNullifiers,
            outputCommitments,
            merkleRoot
        );

        if (!transferVerifier.verifyProof(proofA, proofB, proofC, publicInputs)) {
            revert InvalidProof();
        }
    }

    function _buildTransferPublicInputs(
        bytes32[] calldata inputNullifiers,
        bytes32[] calldata outputCommitments,
        bytes32 merkleRoot
    ) private pure returns (uint256[] memory) {
        uint256[] memory publicInputs = new uint256[](
            inputNullifiers.length + outputCommitments.length + 1
        );

        uint256 idx;
        for (uint256 i; i < inputNullifiers.length;) {
            publicInputs[idx++] = uint256(inputNullifiers[i]);
            unchecked {
                ++i;
            }
        }
        for (uint256 i; i < outputCommitments.length;) {
            publicInputs[idx++] = uint256(outputCommitments[i]);
            unchecked {
                ++i;
            }
        }
        publicInputs[idx] = uint256(merkleRoot);

        return publicInputs;
    }

    function _processTransfer(
        bytes32[] calldata inputNullifiers,
        bytes32[] calldata outputCommitments,
        bytes[] calldata encryptedNotes
    ) private {
        for (uint256 i; i < inputNullifiers.length;) {
            nullifiers[inputNullifiers[i]] = true;
            emit NullifierSpent(inputNullifiers[i]);
            unchecked {
                ++i;
            }
        }

        for (uint256 i; i < outputCommitments.length;) {
            uint256 index = commitmentTree.insert(outputCommitments[i]);
            commitmentIndex[outputCommitments[i]] = index;
            emit NoteCommitted(outputCommitments[i], index, encryptedNotes[i]);
            unchecked {
                ++i;
            }
        }
    }

    function withdraw(
        bytes32 nullifier,
        address recipient,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external override nonReentrant {
        if (nullifiers[nullifier]) {
            revert NullifierAlreadySpent();
        }

        uint256[] memory publicInputs = new uint256[](3);
        publicInputs[0] = uint256(nullifier);
        publicInputs[1] = uint256(uint160(recipient));
        publicInputs[2] = uint256(commitmentTree.root);

        bool proofValid = withdrawVerifier.verifyProof(proofA, proofB, proofC, publicInputs);
        if (!proofValid) {
            revert InvalidProof();
        }

        nullifiers[nullifier] = true;
        emit NullifierSpent(nullifier);
        emit Withdrawal(nullifier);

        uint256 amountToRelease = denomination > 0 ? denomination : _extractAmountFromProof(publicInputs);

        bool released = collateralManager.releaseCollateral(
            address(this),
            recipient,
            amountToRelease,
            nullifier
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

    function _extractAmountFromProof(uint256[] memory publicInputs) private pure returns (uint256 amount) {
        if (publicInputs.length > 1) {
            return publicInputs[1];
        }
        return 0;
    }
}