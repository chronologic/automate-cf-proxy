import { AUTOMATE_API_URL } from './env'

async function get(endpoint: string): Promise<any> {
  const proxyRes = await fetch(AUTOMATE_API_URL + endpoint, {
    method: 'GET',
  })

  return parseRes(proxyRes)
}

async function post(endpoint: string, body: any): Promise<any> {
  const proxyRes = await fetch(AUTOMATE_API_URL + endpoint, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  })

  return parseRes(proxyRes)
}

async function parseRes(res: Response): Promise<any> {
  let json: any

  try {
    json = await res.json()
  } catch (e) {}

  if (res.status >= 200 && res.status < 300) {
    return json
  }

  throw new Error(json?.errors || res.statusText || 'Internal error')
}

export default {
  post,
  get,
}
