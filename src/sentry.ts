import { captureError } from '@cfworker/sentry'

import { SENTRY_DSN } from './env'

const environment = 'production'
const release = '1.0.0'

export function reportException(err: Error, event: FetchEvent, ctx?: any): string {
  try {
    const { event_id, posted } = captureError(SENTRY_DSN, environment, release, err, event.request, ctx)
    event.waitUntil(posted)

    return event_id
  } catch (e) {
    console.error(e)
    return '-1'
  }
}
