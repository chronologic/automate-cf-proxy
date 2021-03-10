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
  email: string
}
