import { keccak256 } from 'ethers/lib/utils'
import { writeFileSync } from 'fs'

import { allowlistedAddresses } from '../libs/envs'

async function main() {
    const exportPath = process.env.FILE_EXPORT_PATH
    if (typeof exportPath !== 'string') return

    const data = `[\n${allowlistedAddresses.map(keccak256).map(s => `    "${s}"`).join(",\n")}\n]`
    writeFileSync(`${exportPath}hashedAllowlist.json`, data, { flag: "w" })
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
