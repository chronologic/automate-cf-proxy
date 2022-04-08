import { MAX_XFAI_GAS_LIMIT, XFAI_CONTRACT_ADDRESS } from '../constants'
import { INFURA_URL } from '../env'
import {
  IAutomateGasEstimateResponse,
  IInternalHandlers,
  IJsonRpcResponse,
  InternalHandler,
  IParsedRequest,
} from '../types'
import { decToHex, gweiToWeiHex } from '../utils'
import automateApi from '../automateApi'
import { makeHandlers } from './common'

const baseHandlers = makeHandlers(fallbackHandler)

const handlers: IInternalHandlers = {
  ...baseHandlers,
  eth_estimateGas: handleEstimateGas,
  eth_gasPrice: handleGasPrice,
}

export function getHandler(parsedReq: IParsedRequest): InternalHandler {
  return handlers[parsedReq.body.method] || fallbackHandler
}

async function handleEstimateGas(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
  const res = await fallbackHandler(parsedReq)

  try {
    if (parsedReq.body.params[0].to === XFAI_CONTRACT_ADDRESS && res.error) {
      delete res.error
      res.result = decToHex(MAX_XFAI_GAS_LIMIT)
    }
  } catch (e) {
    //
  }

  return res
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

  return fallbackHandler(parsedReq)
}

async function fallbackHandler(parsedReq: IParsedRequest): Promise<IJsonRpcResponse> {
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
