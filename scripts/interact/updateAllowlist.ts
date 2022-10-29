import { ethers } from 'hardhat'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from '../libs/const'
import { createMerkleRoot } from '../libs/createMerkleRoot'
import { deployedProxy } from '../libs/deployedProxy'
import { allowlistedAddresses } from '../libs/envs'

async function main() {
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = __SYMBOL__.attach((await deployedProxy()).address) as Latest__SYMBOL__

    const [deployer] = await ethers.getSigners()
    let nonce = await ethers.provider.getTransactionCount(deployer.address)
    await instance.setAllowlist(createMerkleRoot(allowlistedAddresses), { nonce: nonce++ })
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
