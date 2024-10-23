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
          console.log("Network ID:", networkId);
          console.log("Deployed Network:", deployedNetwork);
  
          if (deployedNetwork) {
            const instance = new web3Instance.eth.Contract(SimpleAuction.abi, deployedNetwork.address);
            setContract(instance);

            const highestBid = await instance.methods.highestBid().call();
            setHighestBid(web3Instance.utils.fromWei(highestBid, 'ether'));

            const ended = await instance.methods.auctionEnded().call();
            setAuctionEnded(ended);

            const auctioneer = await instance.methods.auctioneer().call();
            setAuctioneer(auctioneer);
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

  const endAuction = async () => {
    if (contract) {
      try {
        const auctionEndTime = await contract.methods.auctionEndTime().call();
        const auctionEnded = await contract.methods.auctionEnded().call();
        const currentBlock = await web3.eth.getBlock("latest");

        console.log("Current Block Timestamp:", currentBlock.timestamp);
        console.log("Auction End Time:", auctionEndTime);
        console.log("Auction Ended:", auctionEnded);

        if (currentBlock.timestamp < auctionEndTime) {
          throw new Error("Auction has not yet ended.");
        }

        if (auctionEnded) {
          throw new Error("Auction already ended.");
        }

        await contract.methods.endAuction().send({ from: account, gas: 3000000 });
        setAuctionEnded(true);
      } catch (error) {
        console.error("Error ending auction:", error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Auction Platform</h1>
      <p><strong>Auctioneer:</strong> {auctioneer}</p>
      <p><strong>Highest Bid:</strong> {highestBid} ETH</p>

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

      {auctionEnded ? (
        <p className="text-green-500">The auction has ended.</p>
      ) : (
        <button
          onClick={endAuction}
          className="bg-red-500 text-white p-2 rounded"
        >
          End Auction
        </button>
      )}
    </div>
  );
}

export default App;
