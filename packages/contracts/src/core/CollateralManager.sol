// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ICollateralManager} from "../interfaces/ICollateralManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CollateralManager is ICollateralManager, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    mapping(address => address) public underlyingTokens;
    mapping(address => uint256) public totalCollateral;
    mapping(address => bool) public authorizedZkTokens;

    event ZkTokenRegistered(address indexed zkToken, address indexed underlyingToken);
    event ZkTokenAuthorized(address indexed zkToken, bool authorized);

    error UnauthorizedZkToken();
    error ZkTokenAlreadyRegistered();
    error ZkTokenNotRegistered();
    error InsufficientCollateral();
    error InvalidAddress();
    error TransferFailed();

    constructor() Ownable(msg.sender) {}

    function registerZkToken(address zkToken, address underlyingToken) external override onlyOwner {
        if (zkToken == address(0) || underlyingToken == address(0)) {
            revert InvalidAddress();
        }
        if (underlyingTokens[zkToken] != address(0)) {
            revert ZkTokenAlreadyRegistered();
        }

        underlyingTokens[zkToken] = underlyingToken;
        authorizedZkTokens[zkToken] = true;

        emit ZkTokenRegistered(zkToken, underlyingToken);
        emit ZkTokenAuthorized(zkToken, true);
    }

    function setAuthorization(address zkToken, bool authorized) external onlyOwner {
        if (underlyingTokens[zkToken] == address(0)) {
            revert ZkTokenNotRegistered();
        }

        authorizedZkTokens[zkToken] = authorized;
        emit ZkTokenAuthorized(zkToken, authorized);
    }

    function lockCollateral(
        address zkToken,
        uint256 amount,
        bytes32 commitment
    ) external override nonReentrant returns (bool success) {
        if (!authorizedZkTokens[zkToken]) {
            revert UnauthorizedZkToken();
        }
        if (msg.sender != zkToken) {
            revert UnauthorizedZkToken();
        }

        address underlyingToken = underlyingTokens[zkToken];
        if (underlyingToken == address(0)) {
            revert ZkTokenNotRegistered();
        }

        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), amount);

        totalCollateral[zkToken] += amount;

        emit CollateralLocked(commitment);

        return true;
    }

    function releaseCollateral(
        address zkToken,
        address recipient,
        uint256 amount,
        bytes32 nullifier
    ) external override nonReentrant returns (bool success) {
        if (!authorizedZkTokens[zkToken]) {
            revert UnauthorizedZkToken();
        }
        if (msg.sender != zkToken) {
            revert UnauthorizedZkToken();
        }

        address underlyingToken = underlyingTokens[zkToken];
        if (underlyingToken == address(0)) {
            revert ZkTokenNotRegistered();
        }

        if (totalCollateral[zkToken] < amount) {
            revert InsufficientCollateral();
        }

        totalCollateral[zkToken] -= amount;

        IERC20(underlyingToken).safeTransfer(recipient, amount);

        emit CollateralReleased(nullifier);

        return true;
    }

    function getUnderlyingToken(address zkToken) external view override returns (address token) {
        return underlyingTokens[zkToken];
    }

    function getTotalCollateral(address zkToken) external view override returns (uint256 amount) {
        return totalCollateral[zkToken];
    }

    function isAuthorized(address zkToken) external view returns (bool authorized) {
        return authorizedZkTokens[zkToken];
    }
}