const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const debug = require('debug')('dan0bar:blockchain');

class Transaction {

    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    signTransaction(signingKey) {

        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        if (this.fromAddress === null) {
            return true;
        }
        if (!this.signature || this.signature.length === 0) {
            throw new Error("No signature in this transaction!");
        }
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }


}

class Block {

    constructor(timestamp, transactions, previousHash = "") {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;

    }

    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + this.nonce + JSON.stringify(this.transactions)).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
        console.log("      NoNce: " + this.nonce);
        debug(`Block mined: ${this.hash}`);
    }

    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }


}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 3;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock() {
        let block = new Block("12/12/2012", "genesis block", "0");

        return block;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransaction(miningRewardAddress) {

        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log("Block successfully mined!")
        console.log("Transactions: " + JSON.stringify(this.pendingTransactions, null, 2))
        this.chain.push(block);

        this.pendingTransactions = [];
    }

    addTransaction(transaction) {

        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error("Transaction must include from and to address!")
        }
        if (!transaction.isValid()) {
            throw new Error("Cannot add invalid transaction to the chain!");
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address) {
        let balance = 0;
        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }
                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }
        return balance
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.log("Hash: ", currentBlock.hash + '\n');
                console.log("calcHash: ", currentBlock.calculateHash() + '\n');
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;