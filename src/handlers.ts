import { ethers } from 'ethers'
import queryString from 'query-string'

import { INFURA_URL } from './env'
import { IJsonRpcRequest, IJsonRpcResponse, InternalHandler, IParsedRequest } from './types'

const handlers: {
  [key: string]: InternalHandler
} = {
  net_listening: handleNetListening,
  eth_sendRawTransaction: handleSendRawTransaction,
  // eth_getTransactionCount: handleGetTransactionCount,
}

export function getHandler(parsedReq: IParsedRequest): InternalHandler {
  return handlers[parsedReq.body.method] || infuraHandler
}

async function handleNetListening(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  console.log('Handling net_listening', parsedReq)
  return {
    id: parsedReq.body.id,
    jsonrpc: parsedReq.body.jsonrpc,
    result: true,
  }
}

async function handleSendRawTransaction(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  const rawTx = parsedReq.body.params[0] as string
  const tx = ethers.utils.parseTransaction(rawTx)

  return {
    id: parsedReq.body.id,
    jsonrpc: parsedReq.body.jsonrpc,
    result: tx.hash,
  }
}

export async function infuraHandler(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
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
