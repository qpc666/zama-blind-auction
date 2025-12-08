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
  const [activeTab, setActiveTab] = useState('intro');

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">👁️‍🗨️</span> Zama Auction
        </div>
        <div className="nav-links">
          <button
            className={activeTab === 'intro' ? 'active' : ''}
            onClick={() => setActiveTab('intro')}
          >
            Product
          </button>
          <button
            className={activeTab === 'app' ? 'active' : ''}
            onClick={() => setActiveTab('app')}
          >
            Launch App
          </button>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'intro' && <LandingPage onStart={() => setActiveTab('app')} />}
        {activeTab === 'app' && <AuctionApp />}
      </main>
    </div>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">Powered by Zama FHE</div>
        <h1 className="hero-title">
          The Future of Auctions is <span className="gradient-text">Confidential</span>
        </h1>
        <p className="hero-subtitle">
          Experience the first verifiable blind auction on Ethereum.
          Bid without revealing your strategy. Win without exposing your price.
        </p>
        <button className="cta-btn" onClick={onStart}>
          Start Bidding Now <span className="arrow">→</span>
        </button>
      </section>

      {/* Visual Diagram Section */}
      <section className="diagram-section">
        <h2>How It Works</h2>
        <div className="process-flow">
          <div className="flow-step">
            <div className="step-icon">🔒</div>
            <h3>Encrypt</h3>
            <p>Your bid is encrypted locally on your device using FHE keys.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-icon">⚡</div>
            <h3>Submit</h3>
            <p>The encrypted ciphertext is sent to the Sepolia blockchain.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-icon">🙈</div>
            <h3>Compute</h3>
            <p>Smart contract compares encrypted bids without decrypting them.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2>Why Confidentiality Matters</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>MEV Protection</h3>
            <p>Prevent front-running and sandwich attacks. Bots can't exploit what they can't see.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚖️</div>
            <h3>True Fairness</h3>
            <p>No more bid sniping. Every participant competes on equal footing, blind to others' moves.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧩</div>
            <h3>On-Chain Verifiability</h3>
            <p>Unlike off-chain order books, every step is executed and verified on Ethereum.</p>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="roadmap-section">
        <h2>Product Roadmap</h2>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot active"></div>
            <div className="timeline-content">
              <span className="timeline-date">Q4 2024</span>
              <h3>Alpha Launch</h3>
              <p>Deployment on Zama Sepolia. Basic blind auction functionality with FHE integration.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">Q1 2025</span>
              <h3>Multi-Asset Support</h3>
              <p>Integration with ERC-20 tokens (USDC, USDT). Encrypted balances and allowances.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">Q2 2025</span>
              <h3>Vickrey Mechanism</h3>
              <p>Advanced auction types: Second-price auctions to encourage truthful bidding.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">Q3 2025</span>
              <h3>Mainnet Release</h3>
              <p>Official launch on Zama Mainnet. Enterprise API for high-value asset procurement.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuctionApp() {
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
  );
}

export default App;
