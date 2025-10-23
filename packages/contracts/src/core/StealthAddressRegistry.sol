// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IStealthAddressRegistry} from "../interfaces/IStealthAddressRegistry.sol";

contract StealthAddressRegistry is IStealthAddressRegistry {

    struct StealthMetaAddress {
        bytes spendingPubKey;  
        bytes viewingPubKey;   
        bool registered;
    }

    mapping(address => StealthMetaAddress) private stealthMetaAddresses;

    uint256 public totalAnnouncements;

    error NotRegistered();
    error AlreadyRegistered();
    error InvalidPublicKey();
    error InvalidStealthAddress();

    function registerStealthMetaAddress(
        bytes calldata spendingPubKey,
        bytes calldata viewingPubKey
    ) external override {
        if (spendingPubKey.length != 33 || viewingPubKey.length != 33) {
            revert InvalidPublicKey();
        }

        stealthMetaAddresses[msg.sender] = StealthMetaAddress({
            spendingPubKey: spendingPubKey,
            viewingPubKey: viewingPubKey,
            registered: true
        });

        emit StealthMetaAddressSet(msg.sender, spendingPubKey, viewingPubKey);
    }

    function announce(
        bytes calldata ephemeralPubKey,
        address stealthAddress,
        bytes calldata metadata
    ) external override {
        if (ephemeralPubKey.length != 33) {
            revert InvalidPublicKey();
        }

        if (stealthAddress == address(0)) {
            revert InvalidStealthAddress();
        }

        totalAnnouncements++;

        emit Announcement(ephemeralPubKey, stealthAddress, msg.sender, metadata);
    }

    function getStealthMetaAddress(address registrant)
        external
        view
        override
        returns (bytes memory spendingPubKey, bytes memory viewingPubKey)
    {
        StealthMetaAddress storage metaAddr = stealthMetaAddresses[registrant];

        if (!metaAddr.registered) {
            revert NotRegistered();
        }

        return (metaAddr.spendingPubKey, metaAddr.viewingPubKey);
    }

    function isRegistered(address registrant) external view override returns (bool registered) {
        return stealthMetaAddresses[registrant].registered;
    }

    function getStealthMetaAddressBatch(address registrant)
        external
        view
        returns (
            bool registered,
            bytes memory spendingPubKey,
            bytes memory viewingPubKey
        )
    {
        StealthMetaAddress storage metaAddr = stealthMetaAddresses[registrant];

        return (
            metaAddr.registered,
            metaAddr.spendingPubKey,
            metaAddr.viewingPubKey
        );
    }
}