// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IzkERC20 {

    event NoteCommitted(bytes32 indexed commitment, uint256 indexed index, bytes encryptedNote);
    event NullifierSpent(bytes32 indexed nullifier);
    event Deposit(bytes32 indexed commitment);
    event Withdrawal(bytes32 indexed nullifier);

    function deposit(
        uint256 amount,
        bytes32 commitment,
        bytes32 nullifierHash,
        bytes calldata encryptedNote,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external;

    function transfer(
        bytes32[2] calldata inputNullifiers,
        bytes32[2] calldata outputCommitments,
        bytes32 merkleRoot,
        bytes[] calldata encryptedNotes,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external;

    function withdraw(
        uint256 amount,
        address recipient,
        bytes32 commitment,
        bytes32 nullifierHash,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external;

    function commitmentExists(bytes32 commitment) external view returns (bool exists);

    function isNullifierSpent(bytes32 nullifier) external view returns (bool spent);

    function getMerkleRoot() external view returns (bytes32 root);

    function getNextIndex() external view returns (uint256 index);
}