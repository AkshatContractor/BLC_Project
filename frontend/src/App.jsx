import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SimpleAuction from '../../backend/build/contracts/SimpleAuction.json';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [highestBid, setHighestBid] = useState(0);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [auctioneer, setAuctioneer] = useState('');
  const [amount, setAmount] = useState('');
  const [web3, setWeb3] = useState(null);
  const [auctionEndTime, setAuctionEndTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const initWeb3 = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = SimpleAuction.networks[networkId];

          if (deployedNetwork) {
            const instance = new web3Instance.eth.Contract(SimpleAuction.abi, deployedNetwork.address);
            setContract(instance);

            const highestBid = await instance.methods.highestBid().call();
            setHighestBid(web3Instance.utils.fromWei(highestBid, 'ether'));

            const ended = await instance.methods.auctionEnded().call();
            setAuctionEnded(ended);

            const auctioneer = await instance.methods.auctioneer().call();
            setAuctioneer(auctioneer);

            const auctionEndTime = await instance.methods.auctionEndTime().call();
            setAuctionEndTime(Number(auctionEndTime)); // Convert to Number
            setRemainingTime(Number(auctionEndTime) - Math.floor(Date.now() / 1000)); // Calculate remaining time
          } else {
            console.error(`Contract not deployed to detected network ${networkId}.`);
          }
        } catch (error) {
          console.error("Error connecting to MetaMask or getting accounts:", error);
        }
      } else {
        alert("Please install MetaMask to use this application.");
      }
    };

    initWeb3();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!auctionEnded) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = auctionEndTime - currentTime;
        setRemainingTime(timeLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionEndTime, auctionEnded]);

  const formatRemainingTime = (seconds) => {
    if (seconds <= 0) return "Auction has ended";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours}h ${minutes}m ${secs}s`;
  };

  const placeBid = async () => {
    if (contract && amount) {
      try {
        await contract.methods.bid().send({ from: account, value: Web3.utils.toWei(amount, 'ether') });
        const newHighestBid = await contract.methods.highestBid().call();
        setHighestBid(Web3.utils.fromWei(newHighestBid, 'ether'));
      } catch (error) {
        console.error("Error placing bid:", error);
      }
    } else {
      alert("Please enter a valid bid amount.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Auction Platform</h1>
      <p><strong>Auctioneer:</strong> {auctioneer}</p>
      <p><strong>Highest Bid:</strong> {highestBid} ETH</p>

      {/* Display Auction End Time in IST */}
      <p><strong>Auction End Time (IST):</strong> 
        {new Date(auctionEndTime * 1000 + 5.5 * 60 * 60 * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} 
      </p>
      
      <p><strong>Remaining Time:</strong> {formatRemainingTime(remainingTime)}</p>

      {!auctionEnded && (
        <div className="my-4">
          <input
            type="text"
            placeholder="Amount in ETH"
            className="border p-2 mr-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            onClick={placeBid}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Place Bid
          </button>
        </div>
      )}

      {auctionEnded && (
        <p className="text-green-500">The auction has ended.</p>
      )}
    </div>
  );
}

export default App;
