import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SimpleAuction from '../../backend/build/contracts/SimpleAuction.json';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [highestBid, setHighestBid] = useState(0);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [auctioneer, setAuctioneer] = useState('');
  const [highestBidder, setHighestBidder] = useState(''); 
  const [winner, setWinner] = useState(''); 
  const [amount, setAmount] = useState('');
  const [web3, setWeb3] = useState(null);
  const [auctionEndTime, setAuctionEndTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(false); // Loading state

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

            await fetchAuctionDetails(instance);
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

  const fetchAuctionDetails = async (instance) => {
    const highestBid = await instance.methods.highestBid().call();
    setHighestBid(web3.utils.fromWei(highestBid, 'ether'));

    const ended = await instance.methods.auctionEnded().call();
    setAuctionEnded(ended);

    const auctioneer = await instance.methods.auctioneer().call();
    setAuctioneer(auctioneer);

    const highestBidder = await instance.methods.highestBidder().call(); 
    setHighestBidder(highestBidder);

    const auctionEndTime = await instance.methods.auctionEndTime().call();
    setAuctionEndTime(Number(auctionEndTime)); 
    setRemainingTime(Number(auctionEndTime) - Math.floor(Date.now() / 1000)); 

    if (ended) {
      const winner = highestBidder; 
      setWinner(winner);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (contract) {
        fetchAuctionDetails(contract); 
      }
    }, 3000); 

    return () => clearInterval(interval);
  }, [contract]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (!auctionEnded) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = auctionEndTime - currentTime;
        setRemainingTime(timeLeft);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
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
      setLoading(true); // Set loading to true
      try {
        await contract.methods.bid().send({ from: account, value: web3.utils.toWei(amount, 'ether') });
        const newHighestBid = await contract.methods.highestBid().call();
        setHighestBid(web3.utils.fromWei(newHighestBid, 'ether'));

        const newHighestBidder = await contract.methods.highestBidder().call();
        setHighestBidder(newHighestBidder);
      } catch (error) {
        console.error("Error placing bid:", error);
      } finally {
        setLoading(false); // Set loading to false after operation
      }
    } else {
      alert("Please enter a valid bid amount.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Simple Auction Platform</h1>
        <p className="mb-2"><strong>Auctioneer:</strong> {auctioneer}</p>
        <p className="mb-2"><strong>Highest Bid:</strong> {highestBid} ETH</p>
        <p className="mb-2"><strong>Highest Bidder:</strong> {highestBidder}</p> 

        <p className="mb-2"><strong>Auction End Time (IST): </strong> 
        {new Date(auctionEndTime * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} </p>
        
        <p className="mb-4"><strong>Remaining Time:</strong> {formatRemainingTime(remainingTime)}</p>

        {!auctionEnded && (
          <div className="my-4 flex flex-col items-center">
            <input
              type="text"
              placeholder="Amount in ETH"
              className="border p-2 mb-2 w-full rounded-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}/>
            <button
              onClick={placeBid}
              className={`bg-blue-500 text-white p-2 rounded-lg w-full ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={loading}>{loading ? "Placing Bid..." : "Place Bid"}
            </button>
          </div>
        )}

        {auctionEnded && (
          <div className="text-center mt-4">
            <p className="text-green-500">The auction has ended.</p>
            <p><strong>Winner:</strong> {winner}</p> 
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
