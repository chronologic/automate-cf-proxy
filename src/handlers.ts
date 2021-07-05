import { ethers } from 'ethers'
import queryString from 'query-string'

import automateApi from './automateApi'
import cache from './cache'

import { AUTOMATE_PAYMENT_KEY, CHAIN_ID, INFURA_URL } from './env'
import {
  IAutomateGasEstimateResponse,
  IAutomateMaxNonceResponse,
  IAutomateScheduleRequest,
  IAutomateScheduleResponse,
  IJsonRpcResponse,
  InternalHandler,
  IParsedRequest,
} from './types'
import { decToHex, gweiToWeiHex, isTruthy } from './utils'

const xfaiContract = '0xd622dbd384d8c682f1dfe2ec18809c6bcd09bd40'
const maxXfaiGasLimit = 510_000

const handlers: {
  [key: string]: InternalHandler
} = {
  net_listening: handleNetListening,
  eth_sendRawTransaction: handleSendRawTransaction,
  eth_getTransactionCount: handleGetTransactionCount,
  eth_getTransactionReceipt: handleGetTransactionReceipt,
  eth_gasPrice: handleGasPrice,
  eth_estimateGas: handleEstimateGas,
  eth_call: handleCall,
  automate_test: handleAutomateTest,
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

  let txHash = await cache.get(rawTx)

  if (!txHash) {
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

    const resBody: IAutomateScheduleResponse = await automateApi.post(
      '/scheduled?' + queryString.stringify(parsedReq.queryParams),
      automateReq,
    )

    txHash = resBody.transactionHash
    await cache.put(rawTx, txHash)
  }

  return {
    id: parsedReq.body.id,
    jsonrpc: parsedReq.body.jsonrpc,
    result: txHash,
  }
}

async function handleGetTransactionCount(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  const [address] = parsedReq.body.params

  const resBody: IAutomateMaxNonceResponse = await automateApi.get(
    '/address/maxNonce?' + queryString.stringify({ ...parsedReq.queryParams, address, chainId: CHAIN_ID }),
  )
  const txCountAutomate = resBody.nonce + 1

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

async function handleGasPrice(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  if (parsedReq.queryParams.gasPrice) {
    return {
      id: parsedReq.body.id,
      jsonrpc: parsedReq.body.jsonrpc,
      result: gweiToWeiHex(parsedReq.queryParams.gasPrice),
    }
  }

  if (parsedReq.queryParams.confirmationTime) {
    const resBody: IAutomateGasEstimateResponse = await automateApi.get(
      `/ethereum/estimateGas?confirmationTime=${parsedReq.queryParams.confirmationTime}`,
    )

    return {
      id: parsedReq.body.id,
      jsonrpc: parsedReq.body.jsonrpc,
      result: gweiToWeiHex(resBody.gwei),
    }
  }

  return infuraHandler(parsedReq)
}

async function handleEstimateGas(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  const res = await infuraHandler(parsedReq)

  try {
    if (parsedReq.body.params[0].to === xfaiContract && res.error) {
      delete res.error
      res.result = decToHex(maxXfaiGasLimit)
    }
  } catch (e) {
    //
  }

  return res
}

async function handleCall(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  if (
    parsedReq.body.params &&
    parsedReq.body.params[0] &&
    // md5 hash of 'automate'
    parsedReq.body.params[0].to === '0x00000000e7fdc80c0728d856260f92fde10af019'
  ) {
    const queryParams = { ...parsedReq.queryParams }
    delete (queryParams as any).apiKey

    return {
      id: parsedReq.body.id,
      jsonrpc: parsedReq.body.jsonrpc,
      result: { client: 'automate', params: queryParams },
    }
  }

  return infuraHandler(parsedReq)
}

export async function infuraHandler(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  console.log(`Falling back "${parsedReq.body.method}" to Infura...`)
  // console.log('REQ --->', parsedReq.body)

  const proxyRes = await fetch(INFURA_URL, {
    body: JSON.stringify(parsedReq.body),
    method: 'POST',
  })

  const resBody = await proxyRes.json()

  // console.log('RES <---', resBody)

  return resBody
}

async function handleAutomateTest(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  throw new Error('Implementme')
}
