import { SupportedNetworks } from './types'

export const CHAIN_IDS: { [key in SupportedNetworks]: number } = {
  ethereum: 1,
  ropsten: 3,
  arbitrum: 42161,
}

export const RPCS: { [key in SupportedNetworks]: string } = {
  ethereum: process.env.ETHEREUM_RPC_URL as string,
  ropsten: process.env.ROPSTEN_RPC_URL as string,
  arbitrum: process.env.ARBITRUM_RPC_URL as string,
}

export const AUTOMATE_PAYMENT_KEY = process.env.AUTOMATE_PAYMENT_KEY as string
export const AUTOMATE_API_URL = process.env.AUTOMATE_API_URL as string
export const SENTRY_DSN = process.env.SENTRY_DSN as string
