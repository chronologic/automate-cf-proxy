import queryString from 'query-string'

import { handleParsedRequest } from './handlers'
import { reportException } from './sentry'
import { IParsedRequest, IQueryParams } from './types'

export async function handleRequest(event: FetchEvent): Promise<Response> {
  let parsedReq: IParsedRequest | null = null
  try {
    parsedReq = await parseRequest(event.request)
    const valid = isRequestValid(parsedReq)

    console.log('REQ --->', parsedReq.body)

    if (!valid) {
      return handleException('Invalid request', parsedReq)
    }

    const resBody = await handleParsedRequest(parsedReq)

    console.log('<--- RES', parsedReq.body.method, resBody)

    return new Response(JSON.stringify(resBody))
  } catch (e) {
    const eventId = reportException(e as any, event, parsedReq)
    return handleException(`${(e as any)?.message} [eventId: ${eventId}]`, parsedReq)
  }
}

async function parseRequest(request: Request): Promise<IParsedRequest> {
  const body = await request.json()
  const queryParams: IQueryParams = queryString.parseUrl(request.url).query as any

  if (queryParams?.gasPrice) {
    queryParams.gasPrice = Number(queryParams.gasPrice)
  }

  if (!queryParams?.network) {
    queryParams.network = 'ethereum'
  }

  return {
    body,
    queryParams,
  }
}

function isRequestValid(parsedReq: IParsedRequest): boolean {
  const { apiKey, email } = parsedReq.queryParams

  if (!apiKey) {
    return false
  }

  if (!email) {
    return false
  }

  return true
}

function handleException(msg: string, parsedReq: IParsedRequest | null): Response {
  const res = {
    id: parsedReq?.body?.id,
    jsonrpc: parsedReq?.body?.jsonrpc,
    error: { code: -32000, message: msg },
  }

  return new Response(JSON.stringify(res))
}
