// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IStealthAddressRegistry {

    event StealthMetaAddressSet(
        address indexed registrant,
        bytes spendingPubKey,
        bytes viewingPubKey
    );

    event Announcement(
        bytes ephemeralPubKey,
        address indexed stealthAddress,
        address indexed caller,
        bytes metadata
    );

    function registerStealthMetaAddress(
        bytes calldata spendingPubKey,
        bytes calldata viewingPubKey
    ) external;

    function announce(
        bytes calldata ephemeralPubKey,
        address stealthAddress,
        bytes calldata metadata
    ) external;

    function getStealthMetaAddress(address registrant)
        external
        view
        returns (bytes memory spendingPubKey, bytes memory viewingPubKey);

    function isRegistered(address registrant) external view returns (bool registered);
}