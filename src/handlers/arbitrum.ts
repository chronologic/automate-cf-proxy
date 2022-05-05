import { RPCS } from '../env'
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
  const rpcUrl = RPCS[parsedReq.queryParams.network]
  console.log(`Falling back "${parsedReq.body.method}" to ${rpcUrl}...`)
  // console.log('REQ --->', parsedReq.body)

  const proxyRes = await fetch(rpcUrl, {
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(parsedReq.body),
    method: 'POST',
  })

  console.log(1111)

  try {
    const resBody = await proxyRes.json()

    console.log(2222)

    // console.log('RES <---', resBody)

    return resBody
  } catch (e) {
    console.log(3333)
    const resText = await proxyRes.text()

    console.log(4444)
    console.error('ERROR!', resText)

    throw e
  }
}
