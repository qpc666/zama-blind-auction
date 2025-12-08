import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
// @ts-ignore: SDK types might need specific config
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import './App.css';

// Extend Window interface for Ethereum provider
declare global {
  interface Window {
    ethereum: any;
  }
}

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat deployment address
const CONTRACT_ABI = [
  "function bid(bytes calldata encryptedAmount) public",
  "function owner() public view returns (address)",
  "function stopped() public view returns (bool)"
];

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        // Force switch to Sepolia
        await switchNetwork(window.ethereum);

        // Initialize SDK
        await initSDK();

        // Create Instance using SepoliaConfig
        const instance = await createInstance(SepoliaConfig);
        setFhevmInstance(instance);
        setStatus("Ready to bid!");
      } catch (e: any) {
        console.error("Initialization error:", e);
        setStatus("Error: " + (e.message || "Connection failed"));
      }
    }
  };

  const switchNetwork = async (provider: any) => {
    const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'SEP',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.rpc.zama.ai'], // Using Zama's RPC for better compatibility
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  };

  const handleBid = async () => {
    if (!fhevmInstance || !account) return;

    try {
      setStatus("Encrypting bid...");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Encrypt the bid amount (uint32)
      const amount = parseInt(bidAmount);
      if (isNaN(amount)) {
        setStatus("Invalid bid amount");
        return;
      }

      // Encrypt using @zama-fhe/relayer-sdk
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, account);
      input.add32(amount);
      const result = await input.encrypt();

      setStatus("Submitting transaction...");
      // Pass the encrypted handle to the contract
      const tx = await contract.bid(result.handles[0]);
      await tx.wait();

      setStatus("Bid submitted successfully!");
    } catch (e: any) {
      console.error(e);
      setStatus("Error: " + (e.message || "Unknown error"));
    }
  };

  return (
    <div className="container">
      <h1>Confidential Blind Auction</h1>
      <div className="card">
        {!account ? (
          <button onClick={init}>Connect Wallet</button>
        ) : (
          <div>
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <div className="bid-form">
              <input
                type="number"
                placeholder="Enter bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <button onClick={handleBid} disabled={!fhevmInstance}>
                Encrypt & Bid
              </button>
            </div>
            {status && <p className="status">{status}</p>}
          </div>
        )}
      </div>
      <p className="info">
        This is a confidential auction. Your bid is encrypted locally before being sent to the blockchain.
        Only the smart contract can determine the winner.
      </p>
    </div>
  );
}

export default App;
