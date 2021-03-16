const chainIds: { [key: string]: number } = {
  mainnet: 1,
  ropsten: 3,
}

export const INFURA_API_KEY = process.env.INFURA_API_KEY as string
export const INFURA_NETWORK = process.env.INFURA_NETWORK as string
export const INFURA_URL = `https://${INFURA_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
export const CHAIN_ID = chainIds[INFURA_NETWORK]
export const AUTOMATE_PAYMENT_KEY = process.env.AUTOMATE_PAYMENT_KEY as string
export const AUTOMATE_API_URL = process.env.AUTOMATE_API_URL as string
