export type InternalHandler = (parsedReq: IParsedRequest) => Promise<IJsonRpcResponse>

export interface IParsedRequest {
  body: IJsonRpcRequest
  queryParams: IQueryParams
}

export interface IJsonRpcRequest {
  id: number
  jsonrpc: string
  method: string
  params: any[]
}

export interface IJsonRpcResponse {
  id: number
  jsonrpc: string
  result: any
}

export interface IQueryParams {
  apiKey: string
  email: string
  draft?: boolean
  gasPriceAware?: boolean
  gasPrice?: number
}

export interface IAutomateScheduleRequest {
  assetType: string
  conditionAmount: string
  conditionAsset: string
  gasPriceAware: boolean
  paymentEmail: string
  paymentRefundAddress: string
  signedTransaction: string
  timeCondition: number
  timeConditionTZ: string
}

export interface IAutomateScheduleResponse {
  id: string
  key: string
  createdAt: string
  paymentAddress: string
  transactionHash: string
}

export interface IAutomateMaxNonceResponse {
  nonce: number
}
