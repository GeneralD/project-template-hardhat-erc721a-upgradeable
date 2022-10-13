import { upgrades } from 'hardhat'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from './libs/const'
import { deployedProxy } from './libs/deployedProxy'

async function main() {
    const contract = await latest__SYMBOL__Factory
    const instance = await upgrades.upgradeProxy((await deployedProxy()).address, contract) as Latest__SYMBOL__
    await instance.deployed()
    console.log(`proxy address: ${instance.address}`)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
