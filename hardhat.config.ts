import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    version: "0.8.24", // Zama usually recommends 0.8.24 or similar
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun", // Important for recent opcodes
    },
  },
  networks: {
    zama: {
      type: "http",
      url: "https://devnet.zama.ai",
      chainId: 8009,
      accounts: [PRIVATE_KEY],
    },
    local: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 9000, // Example for local fhEVM
      accounts: [PRIVATE_KEY],
    },
  },
});
