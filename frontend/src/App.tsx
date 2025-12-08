import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, hexlify } from 'ethers';
// @ts-ignore: SDK types might need specific config
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import BlindAuctionArtifact from './BlindAuctionArtifact.json';
import './App.css';

// Extend Window interface for Ethereum provider
declare global {
  interface Window {
    ethereum: any;
  }
}

// The deployed contract address on Zama Sepolia
const CONTRACT_ADDRESS = "0xe120C581375231ed802544BCec11e8E58d1eFe4b";

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);
      setStatus("Encrypting bid...");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, BlindAuctionArtifact.abi, signer);

      // Encrypt the bid amount (uint32)
      const amount = parseInt(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        setStatus("Please enter a valid bid amount.");
        setIsLoading(false);
        return;
      }

      // Encrypt using @zama-fhe/relayer-sdk
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, account);
      input.add32(amount);
      const result = await input.encrypt();

      setStatus("Submitting transaction...");
      // Pass the encrypted handle to the contract (convert Uint8Array to hex string)
      const handle = hexlify(result.handles[0]);
      const tx = await contract.bid(handle);
      await tx.wait();

      setStatus("Bid submitted successfully! 🚀");
      setBidAmount("");
    } catch (e: any) {
      console.error(e);
      setStatus("Error: " + (e.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <header className="app-header">
          <h1>Confidential Blind Auction</h1>
          <p className="subtitle">Powered by Zama FHE</p>
        </header>

        <div className="auction-card">
          {!account ? (
            <div className="connect-state">
              <p>Connect your wallet to participate in the encrypted auction.</p>
              <button className="primary-btn" onClick={init}>Connect Wallet</button>
            </div>
          ) : (
            <div className="bid-state">
              <div className="wallet-info">
                <span className="indicator"></span>
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </div>

              <div className="input-group">
                <label>Your Bid Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                className="primary-btn bid-btn"
                onClick={handleBid}
                disabled={!fhevmInstance || isLoading}
              >
                {isLoading ? <span className="loader"></span> : "Encrypt & Place Bid"}
              </button>

              {status && <div className={`status-message ${status.includes("Error") ? "error" : "success"}`}>
                {status}
              </div>}
            </div>
          )}
        </div>

        <footer className="app-footer">
          <p>
            <span className="lock-icon">🔒</span>
            Bids are end-to-end encrypted. Only the smart contract can see the actual amount.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
