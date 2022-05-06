import { ethers } from 'ethers'
import queryString from 'query-string'

import cache from '../cache'
import { AUTOMATE_MD5_ADDRESS, AUTOMATE_MD5_BLOCKHASH, CHAIN_IDS, ZERO_ADDRESS } from '../constants'
import { AUTOMATE_PAYMENT_KEY } from '../env'
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
    eth_getBlockByHash: makeHandleGetBlockByHash(fallbackHandler),
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

  if (parsedReq.queryParams.rejectTxs) {
    throw new Error('Transaction rejected!')
  }

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
    const infuraRes = await fallbackHandler(parsedReq)

    if (!parsedReq.queryParams.nonceFromAutomate) {
      return infuraRes
    }

    const [address] = parsedReq.body.params
    const chainId = CHAIN_IDS[parsedReq.queryParams.network]

    const resBody: IAutomateMaxNonceResponse = await automateApi.get(
      '/address/maxNonce?' + queryString.stringify({ ...parsedReq.queryParams, address, chainId: chainId }),
    )
    const txCountAutomate = resBody.nonce + 1
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
      blockHash: AUTOMATE_MD5_BLOCKHASH,
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

function makeHandleGetBlockByHash(fallbackHandler: InternalHandler): InternalHandler {
  return async (parsedReq: IParsedRequest) => {
    const { params = [] } = parsedReq.body
    const [hash] = params
    const isAutomateBlock = hash === AUTOMATE_MD5_BLOCKHASH

    if (isAutomateBlock) {
      const timestamp = ethers.BigNumber.from(Math.floor(new Date().getTime() / 1000)).toHexString()
      const res = {
        number: '0xac8a4d',
        hash: AUTOMATE_MD5_BLOCKHASH,
        parentHash: '0x0afebc49287252fdcb52f8008291a7ffc18fd1c68a90d2121a60bf2fc9792b19',
        mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: '0x0000000000000000',
        sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        logsBloom:
          '0x00800000000000000000000080000000000000000000000210000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000008000010000000000000000000000000000000001000000000000000010000000000000000000000000000000000000000000000000000000000000000000100000000000000040000040480000200000080020001000000000000000000100000000000000000000000000000000000040000000000001000002000000000000000000000000000000001001000000000000000000000000000000020000000000000000000000000000800000000080000000',
        transactionsRoot: '0xc4e7dfe36d2701ac34bbf46dbc010fc0e688f1be818a71a9c6ad9aee992b4ebc',
        stateRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
        receiptsRoot: '0x812a56370de84a46af95f87fe3b395fb30a583363b38ad2064a550b92ab20ddb',
        miner: '0x0000000000000000000000000000000000000000',
        difficulty: '0x0',
        totalDifficulty: '0x0',
        extraData: '0x',
        size: '0x0',
        gasLimit: '0xbc1100a',
        gasUsed: '0x14106',
        timestamp,
        transactions: ['0x9b500769a66cc57e4df6be02e54017f4daf83ddc42c230db1e194732cb6d8c60'],
        uncles: [],
        l1BlockNumber: '0xe0a4e8',
      }

      return {
        id: parsedReq.body.id,
        jsonrpc: parsedReq.body.jsonrpc,
        result: res,
      }
    }

    return fallbackHandler(parsedReq)
  }
}

function makeHandleCall(fallbackHandler: InternalHandler): InternalHandler {
  return async (parsedReq: IParsedRequest) => {
    const [callParams = {}] = parsedReq.body.params || []
    const { from, to } = callParams
    const isAutomateCheck = from === ZERO_ADDRESS && to === AUTOMATE_MD5_ADDRESS

    if (isAutomateCheck) {
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
