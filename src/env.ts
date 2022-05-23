import { SupportedNetworks } from './types'

// workaround to make env vars appear in process.env
// see https://developers.cloudflare.com/workers/platform/environment-variables/
const process = {
  env: global as any,
}

export const RELEASE_VERSION = process.env.RELEASE_VERSION as string

export const RPCS: { [key in SupportedNetworks]: string } = {
  ethereum: process.env.ETHEREUM_RPC_URL as string,
  ropsten: process.env.ROPSTEN_RPC_URL as string,
  arbitrum: process.env.ARBITRUM_RPC_URL as string,
  arbitrumRinkeby: process.env.ARBITRUM_RINKEBY_RPC_URL as string,
}

export const AUTOMATE_PAYMENT_KEY = process.env.AUTOMATE_PAYMENT_KEY as string
export const AUTOMATE_API_URL = process.env.AUTOMATE_API_URL as string
export const SENTRY_DSN = process.env.SENTRY_DSN as string
