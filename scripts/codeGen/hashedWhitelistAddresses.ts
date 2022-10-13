import { keccak256 } from 'ethers/lib/utils'
import { writeFileSync } from 'fs'

import { whitelistedAddresses } from '../libs/envs'

async function main() {
    const exportPath = process.env.FILE_EXPORT_PATH
    if (typeof exportPath !== 'string') return

    const data = `[\n${whitelistedAddresses.map(keccak256).map(s => `    "${s}"`).join(",\n")}\n]`
    writeFileSync(`${exportPath}hashedWhitelist.json`, data, { flag: "w" })
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
