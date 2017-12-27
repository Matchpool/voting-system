var HDWalletProvider = require("./src/node_modules/truffle-hdwallet-provider");

var mnemonic = "stamp kitchen cotton van whip razor reflect coil anger advance grow adapt";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/jhLkjSjUvTbeccjglIRK")
      },
      network_id: 3,
      gas: 4612388
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/jhLkjSjUvTbeccjglIRK")
      },
      network_id: 4
    }
  }
};
