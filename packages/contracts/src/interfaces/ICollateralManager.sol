// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface ICollateralManager {

    event CollateralLocked(bytes32 indexed commitment);
    event CollateralReleased(bytes32 indexed nullifier);

    function lockCollateral(
        address zkToken,
        uint256 amount,
        bytes32 commitment
    ) external returns (bool success);

    function releaseCollateral(
        address zkToken,
        address recipient,
        uint256 amount,
        bytes32 nullifier
    ) external returns (bool success);

    function getUnderlyingToken(address zkToken) external view returns (address token);

    function getTotalCollateral(address zkToken) external view returns (uint256 amount);

    function registerZkToken(address zkToken, address underlyingToken) external;
}