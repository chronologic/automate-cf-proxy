import { HandlerGetter, IParsedRequest, SupportedNetworks } from '../types'
import { getHandler as getHandler_ethereum } from './ethereum'
import { getHandler as getHandler_arbitrum } from './arbitrum'

const handlerGetters: { [key in SupportedNetworks]: HandlerGetter } = {
  ethereum: getHandler_ethereum,
  ropsten: getHandler_ethereum,
  arbitrum: getHandler_arbitrum,
}

export async function handleParsedRequest(parsedReq: IParsedRequest): Promise<any> {
  const { network } = parsedReq.queryParams

  const handler = handlerGetters[network](parsedReq)
  const res = await handler(parsedReq)

  return res
}
