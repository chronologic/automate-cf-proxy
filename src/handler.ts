import queryString from 'query-string'

import { getHandler } from './handlers'
import { IParsedRequest } from './types'

export async function handleRequest(request: Request): Promise<Response> {
  const parsedReq = await parseRequest(request)
  const valid = validateRequest(parsedReq)

  console.log('REQ', parsedReq.body)

  if (!valid) {
    return new Response('Invalid Request', {
      status: 400,
    })
  }

  const handler = getHandler(parsedReq)
  const resBody = await handler(parsedReq)

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

// const tx = ethers.utils.parseTransaction(
//   '0xf86f8203e78511ed8ec200825208943874d06b61133ae5bd94b2fb39307718c4bc9444893635c9adc5dea000008025a06b4957faf600460b48704086bc63c44645d7b5fca0c7bdd9cf5a9e1a69c875c4a06632a5960fcdeda020998b7aede97e106ca05b37f962263dd3f7e323d84a24f3',
// )

// console.log(tx.nonce)
// console.log(tx.chainId)
