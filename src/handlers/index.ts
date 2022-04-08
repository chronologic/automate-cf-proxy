import { getHandler as getHandler_ethereum } from './ethereum'
import { getHandler as getHandler_arbitrum } from './arbitrum'
import { HandlerGetter, IParsedRequest, SupportedNetworks } from '../types'

const handlerGetters: { [key in SupportedNetworks]: HandlerGetter } = {
  ethereum: getHandler_ethereum,
  arbitrum: getHandler_arbitrum,
}

export async function handleParsedRequest(parsedReq: IParsedRequest): Promise<any> {
  const { network } = parsedReq.queryParams

  const handler = handlerGetters[network](parsedReq)
  const res = await handler(parsedReq)

  return res
}
