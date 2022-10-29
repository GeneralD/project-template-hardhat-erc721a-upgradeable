import { BigNumber } from 'ethers'
import { writeFileSync } from 'fs'
import { ethers } from 'hardhat'

import { deployedProxy } from '../libs/deployedProxy'
import { allowlistedAddresses } from '../libs/envs'

async function main() {
    const exportPath = process.env.FILE_EXPORT_PATH
    if (typeof exportPath !== 'string') return

    const __SYMBOL__ = await ethers.getContractFactory("__SYMBOL__Ver1")
    const instance = __SYMBOL__.attach((await deployedProxy()).address)

    const data = await Promise.all(allowlistedAddresses.map(address => instance.numberAllowlistMinted(address)
        .then(balance => ({ address, balance }))
        .catch(_ => ({ address, balance: BigNumber.from(0) }))
    ))
    const csvBody = data
        .sort((lhs, rhs) => rhs.balance.toNumber() - lhs.balance.toNumber())
        .map(d => `${d.address},${d.balance}`)
        .join("\n")
    const csvHeader = "Address,Balance"
    const csv = `${csvHeader}\n${csvBody}`
    writeFileSync(`${exportPath}allowlist_mint_quantity.csv`, csv, { flag: "w" })
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})