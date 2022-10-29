import { ethers, upgrades } from 'hardhat'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from './libs/const'
import { createMerkleRoot } from './libs/createMerkleRoot'
import { isProxyDeployed } from './libs/deployedProxy'
import { chiefAddresses } from './libs/envs'

async function main() {
  if (await isProxyDeployed()) throw Error("Proxy has already been deployed! 'Upgrade' instead.")
  if (chiefAddresses.length != 4) throw Error("add all VIPs in .env file")

  // We get the contract to deploy
  const __SYMBOL__ = await latest__SYMBOL__Factory
  const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

  await instance.deployed()
  console.log("proxy deployed to: ", instance.address)

  // await instance.setAllowlist(createMerkleRoot(allowlistedAddresses))

  await instance.setChiefList(createMerkleRoot(chiefAddresses))
  await instance.setDistribution(chiefAddresses, 1_000)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
