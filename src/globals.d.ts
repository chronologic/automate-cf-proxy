declare module AUTOMATE_PROXY_KV {
  function put(key: string, value: any, { expirationTtl }: { expirationTtl: number }): Promise<void>
  function get(key: string): Promise<any>
}
