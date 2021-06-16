import queryString from 'query-string'

import { getHandler } from './handlers'
import { handleException } from './sentry'
import { IParsedRequest, IQueryParams } from './types'

export async function handleRequest(event: FetchEvent): Promise<Response> {
  let ctx: any
  try {
    const parsedReq = await parseRequest(event.request)
    ctx = parsedReq
    const valid = validateRequest(parsedReq)

    console.log('REQ --->', parsedReq.body)

    if (!valid) {
      return new Response('Invalid Request', {
        status: 400,
      })
    }

    const handler = getHandler(parsedReq)
    const resBody = await handler(parsedReq)

    console.log('<--- RES', resBody)

    return new Response(JSON.stringify(resBody))
  } catch (e) {
    return handleException(e, event, ctx)
  }
}

async function parseRequest(request: Request): Promise<IParsedRequest> {
  const body = await request.json()
  const queryParams: IQueryParams = queryString.parseUrl(request.url).query as any
  if (queryParams && queryParams.gasPrice) {
    queryParams.gasPrice = Number(queryParams.gasPrice)
  }

  return {
    body,
    queryParams,
  }
}

function validateRequest(parsedReq: IParsedRequest): boolean {
  const { apiKey, email } = parsedReq.queryParams

  if (!apiKey) {
    return false
  }

  if (!email) {
    return false
  }

  return true
}
