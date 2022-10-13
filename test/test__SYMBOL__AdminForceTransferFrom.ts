import { expect, use } from 'chai'
import chaiArrays from 'chai-arrays'
import { ethers, upgrades } from 'hardhat'
import { describe, it } from 'mocha'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from './const'

use(chaiArrays)

describe("Force transfer __SYMBOL__ token by admin", () => {
  it("Owner can transfer token forcely", async () => {
    const [, john, jonny, jonathan] = await ethers.getSigners()
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(2000)
    await instance.adminMintTo(john.address, 4)

    expect(await instance.tokensOfOwner(john.address)).to.ofSize(4)
    expect(await instance.ownerOf(1)).to.equal(john.address)
    expect(await instance.ownerOf(2)).to.equal(john.address)
    expect(await instance.ownerOf(3)).to.equal(john.address)
    expect(await instance.ownerOf(4)).to.equal(john.address)

    await instance.adminForceTransferFrom(john.address, jonny.address, 2)
    await instance.adminForceTransferFrom(john.address, jonathan.address, 4)

    expect(await instance.tokensOfOwner(john.address)).to.ofSize(2)
    expect(await instance.ownerOf(1)).to.equal(john.address)
    expect(await instance.ownerOf(2)).to.equal(jonny.address)
    expect(await instance.ownerOf(3)).to.equal(john.address)
    expect(await instance.ownerOf(4)).to.equal(jonathan.address)
  })

  it("When from value is wrong, should be reverted", async () => {
    const [, john, jonny, jonathan] = await ethers.getSigners()
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(2000)
    await instance.adminMintTo(john.address, 4)

    // should be succeeded
    await instance.adminForceTransferFrom(john.address, jonathan.address, 1)
    expect(await instance.ownerOf(1)).to.equal(jonathan.address)

    // should be failed
    await expect(instance.adminForceTransferFrom(john.address, jonny.address, 1)).reverted
    expect(await instance.ownerOf(1)).to.equal(jonathan.address)
  })

  it("When from tokenId not exist, should be reverted", async () => {
    const [, john, jonny] = await ethers.getSigners()
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(2000)
    await instance.adminMintTo(john.address, 4)

    await expect(instance.adminForceTransferFrom(john.address, jonny.address, 5)).reverted
  })

  it("When from tokenId not exist, should be reverted", async () => {
    const [, john, jonny] = await ethers.getSigners()
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(2000)
    await instance.adminMintTo(john.address, 4)

    await expect(instance.adminForceTransferFrom(john.address, jonny.address, 5)).reverted
  })

  it("When sender is not an owner of the token, transferFrom should be reverted", async () => {
    const [, john, jonny] = await ethers.getSigners()
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(2000)
    await instance.adminMintTo(john.address, 4)

    // standard transferFrom should be failed
    await expect(instance.transferFrom(john.address, jonny.address, 2)).reverted

    // but adminForceTransferFrom is ok
    await instance.adminForceTransferFrom(john.address, jonny.address, 2)
    expect(await instance.ownerOf(2)).to.equal(jonny.address)
  })

  it("When to is zero address, it should be reverted", async () => {
    const [, john] = await ethers.getSigners()
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(2000)
    await instance.adminMintTo(john.address, 4)

    // but adminForceTransferFrom is ok
    await expect(instance.adminForceTransferFrom(john.address, "0x0000000000000000000000000000000000000000", 3)).to.reverted
  })

  it("Only contract owner can send adminForceTransferFrom", async () => {
    const [, john, jonny] = await ethers.getSigners()
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(2000)
    await instance.adminMintTo(john.address, 4)

    await expect(instance.connect(jonny).adminForceTransferFrom(john.address, jonny.address, 3)).to.reverted
    await expect(instance.connect(john).adminForceTransferFrom(john.address, jonny.address, 3)).to.reverted

    await instance.connect(john).transferFrom(john.address, jonny.address, 3)
  })
})
