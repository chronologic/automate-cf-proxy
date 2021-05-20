import queryString from 'query-string'

import { getHandler } from './handlers'
import { IParsedRequest } from './types'

export async function handleRequest(request: Request): Promise<Response> {
  const parsedReq = await parseRequest(request)
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
}

async function parseRequest(request: Request): Promise<IParsedRequest> {
  const body = await request.json()
  const queryParams = queryString.parseUrl(request.url).query as any

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
