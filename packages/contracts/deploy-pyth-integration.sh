#!/bin/bash

# Pyth Integration Deployment Script for Hedera
# This script automates the deployment of PriceOracle and registration of price feeds

set -e  # Exit on error

echo "========================================="
echo "Pyth Integration Deployment on Hedera"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and fill in the required values:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with your configuration"
    exit 1
fi

# Source environment variables
source .env

# Check required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "❌ Error: RPC_URL not set in .env"
    exit 1
fi

echo "Configuration:"
echo "  RPC URL: $RPC_URL"
echo ""

# Function to display menu
show_menu() {
    echo ""
    echo "What would you like to deploy?"
    echo "1) Deploy Mock Tokens (testnet only)"
    echo "2) Deploy PriceOracle Contract"
    echo "3) Register Price Feeds"
    echo "4) Complete Setup (Deploy PriceOracle + Register Feeds)"
    echo "5) Complete Setup with Mock Tokens (testnet only)"
    echo "6) Exit"
    echo ""
}

# Function to deploy mock tokens
deploy_mock_tokens() {
    echo ""
    echo "📦 Deploying Mock Tokens..."
    echo "========================================="
    forge script script/DeployMockTokens.s.sol:DeployMockTokens \
        --rpc-url "$RPC_URL" \
        --broadcast \
        --legacy
    echo ""
    echo "✅ Mock tokens deployed!"
    echo "⚠️  Remember to update your .env file with the deployed token addresses"
}

# Function to deploy PriceOracle
deploy_price_oracle() {
    if [ -z "$PYTH_CONTRACT_ADDRESS" ]; then
        echo "❌ Error: PYTH_CONTRACT_ADDRESS not set in .env"
        echo "Please get the Pyth contract address from: https://docs.pyth.network/price-feeds/contract-addresses/hedera"
        exit 1
    fi

    echo ""
    echo "📝 Deploying PriceOracle Contract..."
    echo "========================================="
    echo "Pyth Contract: $PYTH_CONTRACT_ADDRESS"
    echo ""

    forge script script/DeployPriceOracle.s.sol:DeployPriceOracle \
        --rpc-url "$RPC_URL" \
        --broadcast \
        --legacy

    echo ""
    echo "✅ PriceOracle deployed!"
    echo "⚠️  Remember to update PRICE_ORACLE_ADDRESS in your .env file"
}

# Function to register price feeds
register_price_feeds() {
    if [ -z "$PRICE_ORACLE_ADDRESS" ]; then
        echo "❌ Error: PRICE_ORACLE_ADDRESS not set in .env"
        echo "Please deploy PriceOracle first or set the address in .env"
        exit 1
    fi

    echo ""
    echo "📋 Registering Price Feeds..."
    echo "========================================="
    echo "PriceOracle: $PRICE_ORACLE_ADDRESS"
    echo ""

    forge script script/RegisterPriceFeeds.s.sol:RegisterPriceFeeds \
        --rpc-url "$RPC_URL" \
        --broadcast \
        --legacy

    echo ""
    echo "✅ Price feeds registered!"
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice [1-6]: " choice

    case $choice in
        1)
            deploy_mock_tokens
            ;;
        2)
            deploy_price_oracle
            ;;
        3)
            register_price_feeds
            ;;
        4)
            deploy_price_oracle
            read -p "Press Enter to continue with price feed registration..."
            register_price_feeds
            echo ""
            echo "========================================="
            echo "✅ Complete setup finished!"
            echo "========================================="
            ;;
        5)
            deploy_mock_tokens
            read -p "Update .env with token addresses, then press Enter to continue..."
            deploy_price_oracle
            read -p "Update .env with PRICE_ORACLE_ADDRESS, then press Enter to continue..."
            register_price_feeds
            echo ""
            echo "========================================="
            echo "✅ Complete setup with mock tokens finished!"
            echo "========================================="
            ;;
        6)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-6."
            ;;
    esac

    read -p "Press Enter to continue..."
done
