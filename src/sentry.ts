import { captureError } from '@cfworker/sentry'

import { SENTRY_DSN } from './env'

const environment = 'production'
const release = '1.0.0'

export function handleException(err: Error, event: FetchEvent, ctx?: any): Response {
  const { event_id, posted } = captureError(SENTRY_DSN, environment, release, err, event.request, ctx)
  event.waitUntil(posted)

  return new Response(`Internal server error. Event ID: ${event_id}`, {
    status: 500,
  })
}
