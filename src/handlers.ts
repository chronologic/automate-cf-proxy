import { ethers } from 'ethers'
import queryString from 'query-string'

import { AUTOMATE_API_URL, AUTOMATE_PAYMENT_KEY, CHAIN_ID, INFURA_URL } from './env'
import {
  IAutomateMaxNonceResponse,
  IAutomateScheduleRequest,
  IAutomateScheduleResponse,
  IJsonRpcResponse,
  InternalHandler,
  IParsedRequest,
} from './types'
import { isTruthy } from './utils'

const handlers: {
  [key: string]: InternalHandler
} = {
  net_listening: handleNetListening,
  eth_sendRawTransaction: handleSendRawTransaction,
  eth_getTransactionCount: handleGetTransactionCount,
  eth_getTransactionReceipt: handleGetTransactionReceipt,
}

export function getHandler(parsedReq: IParsedRequest): InternalHandler {
  return handlers[parsedReq.body.method] || infuraHandler
}

async function handleNetListening(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  // console.log('Handling net_listening', parsedReq)
  return {
    id: parsedReq.body.id,
    jsonrpc: parsedReq.body.jsonrpc,
    result: true,
  }
}

async function handleSendRawTransaction(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  const rawTx = parsedReq.body.params[0] as string

  const automateReq: IAutomateScheduleRequest = {
    assetType: 'ethereum',
    conditionAmount: '0',
    conditionAsset: '',
    gasPriceAware: isTruthy(parsedReq.queryParams.gasPriceAware),
    paymentEmail: parsedReq.queryParams.email,
    paymentRefundAddress: AUTOMATE_PAYMENT_KEY,
    signedTransaction: rawTx,
    timeCondition: 0,
    timeConditionTZ: '',
  }

  const proxyRes = await fetch(AUTOMATE_API_URL + '/scheduled?' + queryString.stringify(parsedReq.queryParams), {
    body: JSON.stringify(automateReq),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  })

  const resBody = (await proxyRes.json()) as IAutomateScheduleResponse

  return {
    id: parsedReq.body.id,
    jsonrpc: parsedReq.body.jsonrpc,
    result: resBody.transactionHash,
  }
}

async function handleGetTransactionCount(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  const [address] = parsedReq.body.params

  const proxyRes = await fetch(
    AUTOMATE_API_URL +
      '/address/maxNonce?' +
      queryString.stringify({ ...parsedReq.queryParams, address, chainId: CHAIN_ID }),
  )

  const proxyResBody = (await proxyRes.clone().json()) as IAutomateMaxNonceResponse
  const txCountAutomate = proxyResBody.nonce + 1

  const infuraRes = await infuraHandler(parsedReq)
  const txCountBlockchain = ethers.BigNumber.from(infuraRes.result).toNumber()

  const txCountHex = ethers.BigNumber.from(Math.max(txCountAutomate, txCountBlockchain).toString()).toHexString()

  return {
    id: parsedReq.body.id,
    jsonrpc: parsedReq.body.jsonrpc,
    result: txCountHex,
  }
}

async function handleGetTransactionReceipt(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  const [txHash] = parsedReq.body.params

  const infuraRes = await infuraHandler(parsedReq)

  if (infuraRes.result) {
    return infuraRes
  }

  const res = {
    blockHash: '0xe05c4628a167c11e6e2d9ac5e3366c2cb350234d56c669c6634b55f7e4458b36',
    blockNumber: '0x1',
    contractAddress: null,
    cumulativeGasUsed: '0x1',
    from: '0x0000000000000000000000000000000000000000',
    gasUsed: '0x1',
    logs: [],
    logsBloom:
      '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    status: '0x1',
    to: '0x0000000000000000000000000000000000000000',
    transactionHash: txHash,
    transactionIndex: '0x0',
  }

  return {
    id: parsedReq.body.id,
    jsonrpc: parsedReq.body.jsonrpc,
    result: res,
  }
}

export async function infuraHandler(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  // console.log(`Falling back "${parsedReq.body.method}" to Infura...`)
  // console.log('REQ --->', parsedReq.body)

  const proxyRes = await fetch(INFURA_URL, {
    body: JSON.stringify(parsedReq.body),
    method: 'POST',
  })

  const resBody = await proxyRes.json()

  // console.log('RES <---', resBody)

  return resBody
}
