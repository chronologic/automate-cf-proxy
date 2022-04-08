import { captureError } from '@cfworker/sentry'

import { RELEASE_VERSION, SENTRY_DSN } from './env'
import { IParsedRequest } from './types'

const release = RELEASE_VERSION

export function reportException(err: Error, event: FetchEvent, ctx?: IParsedRequest): string {
  try {
    const environment = ctx?.queryParams.network || 'unknown'
    const { event_id, posted } = captureError(SENTRY_DSN, environment, release, err, event.request, ctx)
    event.waitUntil(posted)

    return event_id
  } catch (e) {
    console.error(e)
    return '-1'
  }
}
