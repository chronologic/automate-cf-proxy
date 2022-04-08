import { ethers } from 'ethers'
import queryString from 'query-string'

import cache from '../cache'
import { AUTOMATE_MD5_ADDRESS } from '../constants'
import { AUTOMATE_PAYMENT_KEY, CHAIN_ID } from '../env'
import {
  IAutomateMaxNonceResponse,
  IAutomateScheduleRequest,
  IAutomateScheduleResponse,
  IInternalHandlers,
  IJsonRpcResponse,
  InternalHandler,
  IParsedRequest,
} from '../types'
import { isTruthy } from '../utils'
import automateApi from '../automateApi'

export function makeHandlers(fallbackHandler: InternalHandler): IInternalHandlers {
  return {
    net_listening: handleNetListening,
    eth_sendRawTransaction: handleSendRawTransaction,
    eth_getTransactionCount: makeHandleGetTransactionCount(fallbackHandler),
    eth_getTransactionReceipt: makeHandleGetTransactionReceipt(fallbackHandler),
    eth_call: makeHandleCall(fallbackHandler),
    cache_test: handleCacheTest,
  }
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
      '/scheduled?source=proxy&' + queryString.stringify(parsedReq.queryParams),
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

function makeHandleGetTransactionCount(fallbackHandler: InternalHandler): InternalHandler {
  return async (parsedReq: IParsedRequest) => {
    const [address] = parsedReq.body.params

    const resBody: IAutomateMaxNonceResponse = await automateApi.get(
      '/address/maxNonce?' + queryString.stringify({ ...parsedReq.queryParams, address, chainId: CHAIN_ID }),
    )
    const txCountAutomate = resBody.nonce + 1

    const infuraRes = await fallbackHandler(parsedReq)
    const txCountBlockchain = ethers.BigNumber.from(infuraRes.result).toNumber()

    const txCountHex = ethers.BigNumber.from(Math.max(txCountAutomate, txCountBlockchain).toString()).toHexString()

    return {
      id: parsedReq.body.id,
      jsonrpc: parsedReq.body.jsonrpc,
      result: txCountHex,
    }
  }
}

function makeHandleGetTransactionReceipt(fallbackHandler: InternalHandler): InternalHandler {
  return async (parsedReq: IParsedRequest) => {
    const [txHash] = parsedReq.body.params

    const infuraRes = await fallbackHandler(parsedReq)

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
}

function makeHandleCall(fallbackHandler: InternalHandler): InternalHandler {
  return async (parsedReq: IParsedRequest) => {
    if (parsedReq.body.params && parsedReq.body.params[0] && parsedReq.body.params[0].to === AUTOMATE_MD5_ADDRESS) {
      const queryParams = { ...parsedReq.queryParams }
      delete (queryParams as any).apiKey

      return {
        id: parsedReq.body.id,
        jsonrpc: parsedReq.body.jsonrpc,
        result: { client: 'automate', params: queryParams },
      }
    }

    return fallbackHandler(parsedReq)
  }
}

const cacheObj: {
  [key: string]: string
} = {}

async function handleCacheTest(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  const payload = parsedReq.body.params[0] as string
  const kvVal = await cache.get(payload)
  const isInKV = !!kvVal
  const isInCache = !!cacheObj[payload]
  await cache.put(payload, payload)
  cacheObj[payload] = payload

  return {
    id: parsedReq.body.id,
    jsonrpc: parsedReq.body.jsonrpc,
    result: { isInKV, isInCache, cacheObj },
  }
}
