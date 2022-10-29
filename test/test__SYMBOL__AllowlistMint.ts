import { expect } from 'chai'
import { keccak256, parseEther } from 'ethers/lib/utils'
import { ethers, upgrades } from 'hardhat'
import MerkleTree from 'merkletreejs'
import { describe } from 'mocha'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from './const'

describe("Mint __SYMBOL__ as allowlisted member", () => {
    it("Allowlisted member can mint and get bonus", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        const [, john, jonny, jonathan] = await ethers.getSigners()

        if (await instance.isAllowlistMintPaused()) await instance.unpauseAllowlistMint()

        // register allowlist
        const allowlisted = [john, jonny, jonathan]
        const leaves = allowlisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const root = tree.getHexRoot()
        await instance.setAllowlist(root)

        // check balance to mint
        const price = await instance.ALLOWLIST_PRICE()
        const quantity = await instance.ALLOWLISTED_OWNER_MINT_LIMIT()
        const totalPrice = price.mul(quantity)
        const balance = await john.getBalance()
        expect(balance.gte(totalPrice)).is.true

        // mint
        const proof = tree.getHexProof(keccak256(john.address))
        await expect(await instance.connect(john).allowlistMint(quantity, true, proof, { value: totalPrice }))
            .to.changeEtherBalances([instance, john], [totalPrice, totalPrice.mul(-1)])

        expect(await instance.numberAllowlistMinted(john.address)).to.equal(quantity)

        // greater than (or equals), because there may be some bonus
        expect((await instance.connect(john).balance()).gte(quantity)).is.true
    })

    it("Not allowlisted member's minting is not allowed", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        const [, john, jonny, jonathan, mike] = await ethers.getSigners()

        if (await instance.isAllowlistMintPaused()) await instance.unpauseAllowlistMint()

        // register allowlist
        const allowlisted = [john, jonny, jonathan]
        const leaves = allowlisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const root = tree.getHexRoot()
        await instance.setAllowlist(root)

        // try to mint
        const proof = tree.getHexProof(keccak256(mike.address))
        const enoughBadget = parseEther("1000")
        await expect(instance.connect(mike).allowlistMint(5, true, proof, { value: enoughBadget })).to.revertedWith("invalid merkle proof")
    })

    it("Allowlisted member can mint but not over the limit", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        const [, john, jonny, jonathan] = await ethers.getSigners()

        if (await instance.isAllowlistMintPaused()) await instance.unpauseAllowlistMint()

        // register allowlist
        const allowlisted = [john, jonny, jonathan]
        const leaves = allowlisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const root = tree.getHexRoot()
        await instance.setAllowlist(root)

        // check balance to mint
        const price = await instance.ALLOWLIST_PRICE()
        const quantity = await instance.ALLOWLISTED_OWNER_MINT_LIMIT()
        const totalPrice = price.mul(quantity)
        const balance = await jonathan.getBalance()
        expect(balance.gte(totalPrice)).is.true

        // mint without bonus
        const proofOfJonathan = tree.getHexProof(keccak256(jonathan.address))
        await expect(await instance.connect(jonathan).allowlistMint(quantity, false, proofOfJonathan, { value: totalPrice }))
            .to.changeEtherBalances([instance, jonathan], [totalPrice, totalPrice.mul(-1)])

        expect(await instance.numberAllowlistMinted(jonathan.address)).to.equal(quantity)

        // try to mint more and fail
        await expect(instance.connect(jonathan).allowlistMint(quantity, false, proofOfJonathan, { value: totalPrice })).to.revertedWith("WL minting exceeds the limit")

        // but other guy is still ok
        const proofOfJonny = tree.getHexProof(keccak256(jonny.address))
        await instance.connect(jonny).allowlistMint(quantity, true, proofOfJonny, { value: totalPrice })

        expect(await instance.numberAllowlistMinted(jonny.address)).to.equal(quantity)
    })

    it("Allowlisted member can mint in allowlist mint limit but not over the limit of entire contract", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        const [, john, jonny, jonathan] = await ethers.getSigners()

        if (await instance.isAllowlistMintPaused()) await instance.unpauseAllowlistMint()

        await instance.setMintLimit(10)

        // register allowlist
        const allowlisted = [john, jonny, jonathan]
        const leaves = allowlisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const root = tree.getHexRoot()
        await instance.setAllowlist(root)

        // check balance to mint
        const price = await instance.ALLOWLIST_PRICE()
        const quantity = await instance.ALLOWLISTED_OWNER_MINT_LIMIT()
        const totalPrice = price.mul(quantity)
        const balance = await jonathan.getBalance()
        expect(balance.gte(totalPrice)).is.true

        // mint without bonus
        const proofOfJonathan = tree.getHexProof(keccak256(jonathan.address))
        await expect(instance.connect(jonathan).allowlistMint(quantity, false, proofOfJonathan, { value: totalPrice })).to.revertedWith("minting exceeds the limit")
    })

    it("Cannot mint if sent ETH is not enough", async () => {
        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        const [, john, jonny, jonathan] = await ethers.getSigners()

        if (await instance.isAllowlistMintPaused()) await instance.unpauseAllowlistMint()

        // register allowlist
        const allowlisted = [john, jonny, jonathan]
        const leaves = allowlisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const root = tree.getHexRoot()
        await instance.setAllowlist(root)

        // check balance to mint
        const price = await instance.ALLOWLIST_PRICE()
        const quantity = await instance.ALLOWLISTED_OWNER_MINT_LIMIT()
        const totalPrice = price.mul(quantity)
        const balance = await john.getBalance()
        expect(balance.gte(totalPrice)).is.true

        // try to mint without enough ETH
        const proof = tree.getHexProof(keccak256(john.address))
        const paid = totalPrice.mul(99).div(100)  // 99% of total price
        await expect(instance.connect(john).allowlistMint(quantity, true, proof, { value: paid })).to.revertedWith("not enough eth")
    })
})