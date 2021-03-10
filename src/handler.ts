import { ethers } from 'ethers'
import queryString from 'query-string'

import { INFURA_URL } from './env'
import { IJsonRpcRequest, IJsonRpcResponse, InternalHandler, IParsedRequest } from './types'

const handlers: {
  [key: string]: InternalHandler
} = {
  // net_listening: handleNetListening,
  // eth_sendRawTransaction: handleSendRawTransaction,
  // eth_getTransactionCount: handleGetTransactionCount,
}

export async function handleRequest(request: Request): Promise<Response> {
  const parsedReq = await parseRequest(request)
  const valid = validateRequest(parsedReq)

  if (!valid) {
    return new Response('Invalid Request', {
      status: 400,
    })
  }

  const handler = getHandler(parsedReq)
  const resBody = await handler(parsedReq)

  return new Response(JSON.stringify(resBody))
}

async function parseRequest(request: Request): Promise<IParsedRequest> {
  const body = await request.json()
  const queryParams = queryString.parseUrl(request.url).query as any

  return {
    body,
    queryParams,
  }
}

function validateRequest(parsedReq: IParsedRequest): boolean {
  let valid = true

  if (!parsedReq.queryParams.email) {
    valid = false
  }

  return valid
}

function getHandler(parsedReq: IParsedRequest): InternalHandler {
  return handlers[parsedReq.body.method] || infuraFallback
}

async function infuraFallback(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  console.log(`Falling back "${parsedReq.body.method}" to Infura...`)
  console.log('REQ --->', parsedReq.body)

  const proxyRes = await fetch(INFURA_URL, {
    body: JSON.stringify(parsedReq.body),
    method: 'POST',
  })

  const resBody = await proxyRes.json()

  console.log('RES <---', resBody)

  return resBody
}

// const tx = ethers.utils.parseTransaction(
//   '0xf86f8203e78511ed8ec200825208943874d06b61133ae5bd94b2fb39307718c4bc9444893635c9adc5dea000008025a06b4957faf600460b48704086bc63c44645d7b5fca0c7bdd9cf5a9e1a69c875c4a06632a5960fcdeda020998b7aede97e106ca05b37f962263dd3f7e323d84a24f3',
// )

// console.log(tx.nonce)
// console.log(tx.chainId)
