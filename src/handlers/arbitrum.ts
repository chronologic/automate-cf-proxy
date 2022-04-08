import { INFURA_URL } from '../env'
import { IInternalHandlers, IJsonRpcResponse, InternalHandler, IParsedRequest } from '../types'
import { makeHandlers } from './common'

const baseHandlers = makeHandlers(fallbackHandler)

const handlers: IInternalHandlers = {
  ...baseHandlers,
}

export function getHandler(parsedReq: IParsedRequest): InternalHandler {
  return handlers[parsedReq.body.method] || fallbackHandler
}

async function fallbackHandler(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  console.log(`Falling back "${parsedReq.body.method}" to default handler...`)
  // console.log('REQ --->', parsedReq.body)

  const proxyRes = await fetch(INFURA_URL, {
    body: JSON.stringify(parsedReq.body),
    method: 'POST',
  })

  const resBody = await proxyRes.json()

  // console.log('RES <---', resBody)

  return resBody
}
