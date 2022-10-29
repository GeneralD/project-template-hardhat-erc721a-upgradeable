import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'
import { ethers, upgrades } from 'hardhat'
import MerkleTree from 'merkletreejs'
import { describe, it } from 'mocha'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from './const'

describe("Pause __SYMBOL__", () => {
    it("Toggle allowlist mint pausing", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        // unpause if it's paused
        if (await instance.isAllowlistMintPaused())
            await instance.unpauseAllowlistMint()

        await expect(instance.pauseAllowlistMint())
            .to.emit(instance, "AllowlistMintPaused")

        expect(await instance.isAllowlistMintPaused()).is.true

        await expect(instance.pauseAllowlistMint())
            .to.revertedWith("allowlist mint: paused")

        await expect(instance.unpauseAllowlistMint())
            .to.emit(instance, "AllowlistMintUnpaused")

        expect(await instance.isAllowlistMintPaused()).is.false

        await expect(instance.unpauseAllowlistMint())
            .to.revertedWith("allowlist mint: not paused")
    })


    it("Toggle public mint pausing", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        // unpause if it's paused
        if (await instance.isPublicMintPaused())
            await instance.unpausePublicMint()

        await expect(instance.pausePublicMint())
            .to.emit(instance, "PublicMintPaused")

        expect(await instance.isPublicMintPaused()).is.true

        await expect(instance.pausePublicMint())
            .to.revertedWith("public mint: paused")

        await expect(instance.unpausePublicMint())
            .to.emit(instance, "PublicMintUnpaused")

        expect(await instance.isPublicMintPaused()).is.false

        await expect(instance.unpausePublicMint())
            .to.revertedWith("public mint: not paused")
    })


    it("Toggle chief mint pausing", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        // unpause if it's paused
        if (await instance.isChiefMintPaused())
            await instance.unpauseChiefMint()

        await expect(instance.pauseChiefMint())
            .to.emit(instance, "ChiefMintPaused")

        expect(await instance.isChiefMintPaused()).is.true

        await expect(instance.pauseChiefMint())
            .to.revertedWith("chief mint: paused")

        await expect(instance.unpauseChiefMint())
            .to.emit(instance, "ChiefMintUnpaused")

        expect(await instance.isChiefMintPaused()).is.false

        await expect(instance.unpauseChiefMint())
            .to.revertedWith("chief mint: not paused")
    })

    it("Only admin can pause", async () => {
        const [, john] = await ethers.getSigners()
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        await expect(instance.connect(john).pauseChiefMint()).to.revertedWith("Ownable: caller is not the owner")
        await expect(instance.connect(john).pausePublicMint()).to.revertedWith("Ownable: caller is not the owner")
        await expect(instance.connect(john).pauseAllowlistMint()).to.revertedWith("Ownable: caller is not the owner")
    })

    it("Allowlist mint is not available if it's paused", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__
        const [, john, jonny, jonathan] = await ethers.getSigners()

        if (!(await instance.isAllowlistMintPaused())) await instance.pauseAllowlistMint()

        // register allowlist
        const allowlisted = [john, jonny, jonathan]
        const leaves = allowlisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const root = tree.getHexRoot()
        await instance.setAllowlist(root)

        // check balance to mint
        const price: BigNumber = await instance.ALLOWLIST_PRICE()
        const quantity: BigNumber = await instance.ALLOWLISTED_OWNER_MINT_LIMIT()
        const totalPrice = price.mul(quantity)
        const balance = await jonathan.getBalance()
        expect(balance.gte(totalPrice)).is.true

        const proofOfJonathan = tree.getHexProof(keccak256(jonathan.address))
        await expect(instance.connect(jonathan).allowlistMint(quantity, false, proofOfJonathan, { value: totalPrice })).to.revertedWith("allowlist mint: paused")
    })
})