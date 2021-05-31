import { BigNumber, BigNumberish } from 'ethers'

export function isTruthy(value: any): boolean {
  return value === true || value === 'true' || value == 1
}

export function gweiToWeiHex(gwei: BigNumberish): string {
  return gweiToWei(gwei).toHexString()
}

export function gweiToWei(gwei: BigNumberish): BigNumber {
  return BigNumber.from(gwei).mul(BigNumber.from(10 ** 9))
}
