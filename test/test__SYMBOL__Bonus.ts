import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { upgrades } from 'hardhat'
import { describe, it } from 'mocha'

import { Latest__SYMBOL__, latest__SYMBOL__Factory } from './const'

describe("__SYMBOL__ allowlist bonus", () => {
  it("Check bonus", async () => {
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(100)
    const quantity = BigNumber.from(25)
    const bonusPer = await instance.ALLOWLIST_BONUS_PER()
    expect(await instance.bonusQuantity(quantity)).to.equal(quantity.add(quantity.div(bonusPer)))
  })

  it("Check bonus failed if not enough stocks", async () => {
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(10)
    await expect(instance.bonusQuantity(11)).to.reverted
  })

  it("Full bonus is not given when not enough stocks to give bonus", async () => {
    const __SYMBOL__ = await latest__SYMBOL__Factory
    const instance = await upgrades.deployProxy(__SYMBOL__) as Latest__SYMBOL__

    await instance.setMintLimit(30)
    expect(await instance.bonusQuantity(29)).to.equal(30)
  })
})
