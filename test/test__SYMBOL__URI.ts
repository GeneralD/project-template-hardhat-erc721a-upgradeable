import { expect, use } from 'chai'
import chaiString from 'chai-string'
import { upgrades } from 'hardhat'
import { describe, it } from 'mocha'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from './const'

use(chaiString)

describe("__SYMBOL__ URI", () => {
    it("Default baseURI ends with a slash", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        expect(await instance.baseURI()).to.endWith("/")
    })

    it("Check tokenURI for tokenId", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        await instance.setBaseURI("https://test.com/")

        await instance.setMintLimit(10)
        await instance.adminMint(10)

        expect(await instance.tokenURI(8)).to.equal("https://test.com/8.json")
    })

    it("Reading tokenURI should be reverted for tokenId which is not minted yet", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        await expect(instance.tokenURI(8)).to.reverted
    })

    it("Reading tokenURI should be reverted for tokenId which is already burned", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        await instance.setMintLimit(10)
        await instance.adminMint(10)
        await instance.burn(6)

        await expect(instance.tokenURI(6)).to.reverted
    })

    it("Check contractURI", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        await instance.setBaseURI("https://test.com/")
        expect(await instance.contractURI()).to.equal("https://test.com/index.json")
    })
})
