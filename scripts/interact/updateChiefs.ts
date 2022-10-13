import { ethers } from 'hardhat'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from '../libs/const'
import { createMerkleRoot } from '../libs/createMerkleRoot'
import { deployedProxy } from '../libs/deployedProxy'
import { chiefAddresses } from '../libs/envs'

async function main() {
    // We get the contract to deploy
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = __SYMBOL__.attach((await deployedProxy()).address) as Latest__SYMBOL__

    console.log(`proxy address: ${instance.address}`)

    const [deployer] = await ethers.getSigners()
    let nonce = await ethers.provider.getTransactionCount(deployer.address)
    await instance.setChiefList(createMerkleRoot(chiefAddresses), { nonce: nonce++ })
    await instance.setDistribution(chiefAddresses, $$distribution per chief in percentage$$00, { nonce: nonce++ }) // $$distribution per chief in percentage$$%
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
