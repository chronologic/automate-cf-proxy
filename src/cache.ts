// md5 to ensure key length does not go above max 512 chars allowed
import md5 from 'md5'

async function put(key: string, value: string): Promise<void> {
  await AUTOMATE_PROXY_KV.put(md5(key), value, { expirationTtl: 600 })
}

async function get(key: string): Promise<any> {
  return AUTOMATE_PROXY_KV.get(md5(key))
}

export default {
  put,
  get,
}
