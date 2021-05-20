async function put(key: string, value: string): Promise<void> {
  await AUTOMATE_PROXY_KV.put(key, value, { expirationTtl: 600 })
}

async function get(key: string): Promise<any> {
  return AUTOMATE_PROXY_KV.get(key)
}

export default {
  put,
  get,
}
