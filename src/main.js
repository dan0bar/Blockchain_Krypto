const {Blockchain, Transaction} = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


const myKey = ec.keyFromPrivate('5a48be651160a6c420e39f639fdd2ae4ded4638f963d6af0211b8400b1cf156f');
const myWalletAddress = myKey.getPublic('hex');


let dan0barCoin = new Blockchain();


const tx1 = new Transaction(myWalletAddress, 'publicKey', 10);
tx1.signTransaction(myKey);
dan0barCoin.addTransaction(tx1);


console.log("Starting the Miner!" + '\n');
dan0barCoin.minePendingTransaction(myWalletAddress);


console.log("Balance of Dan0Bar: " + dan0barCoin.getBalanceOfAddress(myWalletAddress) + '\n');

console.log("Is chain valid?", dan0barCoin.isChainValid());

// console.log(JSON.stringify(dan0barCoin, null, 4))