module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,  
      network_id: "*",  
    },
  },
  compilers: {
    solc: {
      version: "0.8.18", // Specify the desired compiler version
      settings: {        // Additional compiler settings (optional)
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
  },
};
