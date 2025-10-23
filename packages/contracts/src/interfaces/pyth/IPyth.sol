// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.30;

import {PythStructs} from "./PythStructs.sol";

interface IPyth {

    function getValidTimePeriod() external view returns (uint256);

    function getPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory price);

    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (PythStructs.Price memory price);

    function getEmaPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory price);

    function getEmaPriceNoOlderThan(bytes32 id, uint256 age)
        external
        view
        returns (PythStructs.Price memory price);

    function updatePriceFeeds(bytes[] calldata updateData) external payable;

    function updatePriceFeedsIfNecessary(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64[] calldata publishTimes
    ) external payable;

    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount);

    function parsePriceFeedUpdates(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64 minPublishTime,
        uint64 maxPublishTime
    ) external payable returns (PythStructs.PriceFeed[] memory priceFeeds);
}