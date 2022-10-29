import { expect } from 'chai'
import { keccak256 } from 'ethers/lib/utils'
import { ethers, upgrades } from 'hardhat'
import { MerkleTree } from 'merkletreejs'
import { describe, it } from 'mocha'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from './const'

describe("__SYMBOL__ allowlist", () => {
    it("Allowlisted member is verified", async () => {
        const [, john, jonny, jonathan] = await ethers.getSigners()
        const allowlisted = [john, jonny, jonathan]

        const leaves = allowlisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const root = tree.getHexRoot()

        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        await instance.setAllowlist(root)
        await instance.unpauseAllowlistMint()

        // john is allowlisted
        const proofOfJohn = tree.getHexProof(keccak256(john.address))
        expect(await instance.connect(john).isAllowlisted(proofOfJohn)).is.true
        // jonny is allowlisted
        const proofOfJonny = tree.getHexProof(keccak256(jonny.address))
        expect(await instance.connect(jonny).isAllowlisted(proofOfJonny)).is.true
        // jonathan is allowlisted
        const proofOfJonathan = tree.getHexProof(keccak256(jonathan.address))
        expect(await instance.connect(jonathan).isAllowlisted(proofOfJonathan)).is.true
    })

    it("Not allowlisted member is not verified", async () => {
        const [deployer, john, jonny, jonathan, mike, michael, mick] = await ethers.getSigners()
        const allowlisted = [john, jonny, jonathan]

        const leaves = allowlisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const root = tree.getHexRoot()

        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        await instance.setAllowlist(root)
        await instance.unpauseAllowlistMint()

        // deployer is not allowlisted
        const proofOfDeployer = tree.getHexProof(keccak256(deployer.address))
        expect(await instance.isAllowlisted(proofOfDeployer)).is.false
        // mike is not allowlisted
        const proofOfMike = tree.getHexProof(keccak256(mike.address))
        expect(await instance.isAllowlisted(proofOfMike)).is.false
        expect(await instance.connect(mike).isAllowlisted(proofOfDeployer)).is.false
        // michael is not allowlisted
        const proofOfMichael = tree.getHexProof(keccak256(michael.address))
        expect(await instance.connect(michael).isAllowlisted(proofOfMichael)).is.false
        // mick is not allowlisted
        const proofOfMick = tree.getHexProof(keccak256(mick.address))
        expect(await instance.connect(mick).isAllowlisted(proofOfMick)).is.false
    })

    it("Other's hex proof is invalid", async () => {
        const [, john, jonny, jonathan, mike] = await ethers.getSigners()
        const allowlisted = [john, jonny, jonathan]

        const leaves = allowlisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const root = tree.getHexRoot()

        const __SYMBOL__ = await latest__SYMBOL__Factory
        const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

        await instance.setAllowlist(root)
        await instance.unpauseAllowlistMint()

        const proofOfJohn = tree.getHexProof(keccak256(john.address))
        expect(await instance.connect(mike).isAllowlisted(proofOfJohn)).is.false

        const proofOfJonny = tree.getHexProof(keccak256(jonny.address))
        expect(await instance.connect(mike).isAllowlisted(proofOfJonny)).is.false

        const proofOfJonathan = tree.getHexProof(keccak256(jonathan.address))
        expect(await instance.connect(mike).isAllowlisted(proofOfJonathan)).is.false

        // they are allowlisted, but other member's proof is not valid
        expect(await instance.connect(jonny).isAllowlisted(proofOfJohn)).is.false
        expect(await instance.connect(jonny).isAllowlisted(proofOfJonathan)).is.false
    })
})
