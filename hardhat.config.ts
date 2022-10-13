import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'

import * as dotenv from 'dotenv'
import { HardhatUserConfig, task } from 'hardhat/config'

dotenv.config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

const accounts = [
  process.env.DEPROY_WALLET_PRIVATE_KEY,
].filter((elm?: string): elm is string => elm !== undefined)

const testAccounts = [
  process.env.TEST_WALLET_PRIVATE_KEY,
].filter((elm?: string): elm is string => elm !== undefined)

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // Ethereum networks
    mainnet: {
      url: process.env.MAINNET_URL || "",
      chainId: 1,
      accounts: accounts,
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      chainId: 5,
      accounts: testAccounts,
    },
    // Binance smart chains
    bsc_mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: accounts,
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-2-s3.binance.org:8545/",
      chainId: 97,
      accounts: testAccounts,
    },
  },
  gasReporter: {
    enabled: true,
    currency: "JPY",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    // apiKey: process.env.BSCSCAN_API_KEY,
  },
}

export default config
