import { SupportedNetworks } from './types'

export const AUTOMATE_MD5_ADDRESS = '0x00000000e7fdc80c0728d856260f92fde10af019' // md5 hash of the word 'automate'

export const XFAI_CONTRACT_ADDRESS = '0xd622dbd384d8c682f1dfe2ec18809c6bcd09bd40'
export const MAX_XFAI_GAS_LIMIT = 510_000

export const CHAIN_IDS: { [key in SupportedNetworks]: number } = {
  ethereum: 1,
  ropsten: 3,
  arbitrum: 42161,
  arbitrumRinkeby: 421611,
}
