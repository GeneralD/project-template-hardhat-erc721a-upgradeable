export const chiefAddresses = [
    process.env.CEO_ADDRESS,
    process.env.COO_ADDRESS,
    process.env.CFO_ADDRESS,
].filter((elm?: string): elm is string => elm !== undefined && elm.startsWith("0x"))

export const allowlistedAddresses = [...new Set(
    process.env.ALLOWLIST_ADDRESSES?.split("\n").filter(address => address.startsWith("0x"))
)]