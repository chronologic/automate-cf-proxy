import { BigNumber, BigNumberish } from 'ethers'

export function isTruthy(value: any): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

export function gweiToWeiHex(gwei: BigNumberish): string {
  return gweiToWei(gwei).toHexString()
}

export function gweiToWei(gwei: BigNumberish): BigNumber {
  return BigNumber.from(gwei).mul(BigNumber.from(10 ** 9))
}

export function hexToDec(hex: string): number {
  return BigNumber.from(hex).toNumber()
}

export function decToHex(dec: number): string {
  return BigNumber.from(dec).toHexString()
}
