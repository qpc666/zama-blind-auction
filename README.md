# Zama Blind Auction

A confidential blind auction dApp built using Zama's fhEVM.

## Overview

This project demonstrates how to build a privacy-preserving auction where:
- **Bids are encrypted**: No one (including the auctioneer) can see the bid amounts during the auction.
- **Winner is determined on-chain**: The smart contract compares encrypted bids homomorphically to find the highest bidder.
- **Privacy is preserved**: Only the winner and the winning bid are revealed after the auction ends.

## Prerequisites

- Node.js (v20 or v22 recommended)
- Docker (for running local fhEVM node)

## Installation

1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd zama-blind-auction
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

### Compile

```bash
npx hardhat compile
```

### Test

To run the tests, you need a running fhEVM node.

1.  Start the fhEVM docker container (see Zama documentation).
2.  Run tests:
    ```bash
    npx hardhat test
    ```

### Deploy

To deploy to the Zama Devnet:

1.  Set your `PRIVATE_KEY` in `.env` (or export it).
2.  Run:
    ```bash
    npx hardhat run scripts/deploy.ts --network zama
    ```

### Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies (if not done):
    ```bash
    npm install
    ```
3.  Start the dev server:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173` in your browser.


## License

MIT
