// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {PriceOracle} from "../src/core/PriceOracle.sol";
import {IPriceOracle} from "../src/interfaces/IPriceOracle.sol";
import {MockPyth} from "./mocks/MockPyth.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract PriceOracleTest is Test {
    PriceOracle public priceOracle;
    MockPyth public mockPyth;
    MockERC20 public token;

    address public owner = address(this);
    address public user = address(0x1);

    bytes32 public constant ETH_USD_PRICE_FEED_ID =
        0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    function setUp() public {
        mockPyth = new MockPyth();
        token = new MockERC20("Test Token", "TEST", 18);

        priceOracle = new PriceOracle(address(mockPyth));

        mockPyth.setPrice(
            ETH_USD_PRICE_FEED_ID,
            2000_00000000, 
            1_00000000, 
            -8, 
            block.timestamp
        );
    }

    function testRegisterPriceFeed() public {
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);

        bytes32 registeredId = priceOracle.getPriceFeedId(address(token));
        assertEq(registeredId, ETH_USD_PRICE_FEED_ID);
        assertTrue(priceOracle.hasPriceFeed(address(token)));
    }

    function testRegisterPriceFeedEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit IPriceOracle.PriceFeedRegistered(address(token), ETH_USD_PRICE_FEED_ID);

        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);
    }

    function testCannotRegisterPriceFeedTwice() public {
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);

        vm.expectRevert(PriceOracle.PriceFeedAlreadyRegistered.selector);
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);
    }

    function testCannotRegisterZeroAddressToken() public {
        vm.expectRevert(PriceOracle.InvalidToken.selector);
        priceOracle.registerPriceFeed(address(0), ETH_USD_PRICE_FEED_ID);
    }

    function testCannotRegisterZeroPriceId() public {
        vm.expectRevert(PriceOracle.InvalidPriceId.selector);
        priceOracle.registerPriceFeed(address(token), bytes32(0));
    }

    function testOnlyOwnerCanRegisterPriceFeed() public {
        vm.prank(user);
        vm.expectRevert();
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);
    }

    function testGetPrice() public {
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);

        IPriceOracle.Price memory price = priceOracle.getPrice(address(token));

        assertEq(price.price, 2000_00000000);
        assertEq(price.conf, 1_00000000);
        assertEq(price.expo, -8);
        assertEq(price.publishTime, block.timestamp);
    }

    function testGetPriceInUsd() public {
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);

        uint256 priceInUsd = priceOracle.getPriceInUsd(address(token), 18);

        assertEq(priceInUsd, 2000 * 10 ** 18);
    }

    function testGetPriceInUsdWithDifferentDecimals() public {
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);

        uint256 priceInUsd = priceOracle.getPriceInUsd(address(token), 6);

        assertEq(priceInUsd, 2000 * 10 ** 6);
    }

    function testGetPriceUnregisteredToken() public {
        vm.expectRevert(PriceOracle.PriceFeedNotRegistered.selector);
        priceOracle.getPrice(address(token));
    }

    function testGetPriceInUsdUnregisteredToken() public {
        vm.expectRevert(PriceOracle.PriceFeedNotRegistered.selector);
        priceOracle.getPriceInUsd(address(token), 18);
    }

    function testGetPriceUnsafe() public {
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);

        vm.warp(block.timestamp + 200);

        mockPyth.setPrice(ETH_USD_PRICE_FEED_ID, 1500_00000000, 1_00000000, -8, block.timestamp - 120);

        IPriceOracle.Price memory price = priceOracle.getPriceUnsafe(address(token));
        assertEq(price.price, 1500_00000000);
    }

    function testGetPriceRevertsOnStalePrice() public {
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);

        vm.warp(block.timestamp + 200);

        mockPyth.setPrice(ETH_USD_PRICE_FEED_ID, 1500_00000000, 1_00000000, -8, block.timestamp - 120);

        vm.expectRevert("Price too old");
        priceOracle.getPrice(address(token));
    }

    function testUpdatePriceFeeds() public {
        bytes[] memory updateData = new bytes[](1);
        updateData[0] = abi.encodePacked(ETH_USD_PRICE_FEED_ID, uint256(2500_00000000));

        uint256 fee = priceOracle.getUpdateFee(updateData);

        vm.expectEmit(false, false, false, false);
        emit IPriceOracle.PricesUpdated(new bytes32[](0), fee);

        priceOracle.updatePriceFeeds{value: fee}(updateData);
    }

    function testUpdatePriceFeedsInsufficientFee() public {
        bytes[] memory updateData = new bytes[](1);
        updateData[0] = abi.encodePacked(ETH_USD_PRICE_FEED_ID, uint256(2500_00000000));

        uint256 fee = priceOracle.getUpdateFee(updateData);

        vm.expectRevert(PriceOracle.InsufficientFee.selector);
        priceOracle.updatePriceFeeds{value: fee - 1}(updateData);
    }

    function testUpdatePriceFeedsRefundsExcess() public {
        bytes[] memory updateData = new bytes[](1);
        updateData[0] = abi.encodePacked(ETH_USD_PRICE_FEED_ID, uint256(2500_00000000));

        uint256 fee = priceOracle.getUpdateFee(updateData);
        uint256 excessPayment = fee + 1 ether;

        uint256 balanceBefore = address(this).balance;
        priceOracle.updatePriceFeeds{value: excessPayment}(updateData);
        uint256 balanceAfter = address(this).balance;

        assertEq(balanceBefore - balanceAfter, fee);
    }

    function testGetUpdateFee() public view {
        bytes[] memory updateData = new bytes[](2);
        updateData[0] = new bytes(32);
        updateData[1] = new bytes(32);

        uint256 fee = priceOracle.getUpdateFee(updateData);

        assertEq(fee, 2);
    }

    function testSetMaxPriceAge() public {
        priceOracle.setMaxPriceAge(120);
        assertEq(priceOracle.maxPriceAge(), 120);
    }

    function testOnlyOwnerCanSetMaxPriceAge() public {
        vm.prank(user);
        vm.expectRevert();
        priceOracle.setMaxPriceAge(120);
    }

    function testGetPythContract() public view {
        assertEq(priceOracle.getPythContract(), address(mockPyth));
    }

    function testHasPriceFeed() public {
        assertFalse(priceOracle.hasPriceFeed(address(token)));

        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);

        assertTrue(priceOracle.hasPriceFeed(address(token)));
    }

    function testGetPriceFeedId() public {
        priceOracle.registerPriceFeed(address(token), ETH_USD_PRICE_FEED_ID);

        bytes32 id = priceOracle.getPriceFeedId(address(token));
        assertEq(id, ETH_USD_PRICE_FEED_ID);
    }

    function testGetPriceFeedIdUnregistered() public {
        vm.expectRevert(PriceOracle.PriceFeedNotRegistered.selector);
        priceOracle.getPriceFeedId(address(token));
    }

    function testPriceWithLargeExponent() public {
        bytes32 customPriceId = bytes32(uint256(1));
        mockPyth.setPrice(
            customPriceId,
            5, 
            0, 
            18, 
            block.timestamp
        );

        priceOracle.registerPriceFeed(address(token), customPriceId);

        uint256 priceInUsd = priceOracle.getPriceInUsd(address(token), 18);

        assertEq(priceInUsd, 5 * 10 ** 36);
    }

    function testPriceWithNegativeExponent() public {
        bytes32 customPriceId = bytes32(uint256(2));
        mockPyth.setPrice(
            customPriceId,
            5000_000000, 
            0,
            -6, 
            block.timestamp
        );

        priceOracle.registerPriceFeed(address(token), customPriceId);

        uint256 priceInUsd = priceOracle.getPriceInUsd(address(token), 18);

        assertEq(priceInUsd, 5000 * 10 ** 18);
    }

    function testCannotGetNegativePrice() public {
        bytes32 customPriceId = bytes32(uint256(3));
        mockPyth.setPrice(
            customPriceId,
            -100, 
            0,
            -8,
            block.timestamp
        );

        priceOracle.registerPriceFeed(address(token), customPriceId);

        vm.expectRevert(PriceOracle.PriceNotPositive.selector);
        priceOracle.getPrice(address(token));
    }

    function testCannotGetZeroPrice() public {
        bytes32 customPriceId = bytes32(uint256(4));
        mockPyth.setPrice(
            customPriceId,
            0, 
            0,
            -8,
            block.timestamp
        );

        priceOracle.registerPriceFeed(address(token), customPriceId);

        vm.expectRevert(PriceOracle.PriceNotPositive.selector);
        priceOracle.getPrice(address(token));
    }

    receive() external payable {}
}