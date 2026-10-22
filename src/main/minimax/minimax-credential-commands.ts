/** MiniMax credential status and storage-read diagnostics for this host. */
import {
  getMiniMaxSessionCookieProtection,
  hasMiniMaxSessionCookie,
  COOKIE_ENVELOPE_PREFIX,
  getMiniMaxCookiePath
} from './minimax-cookie-store'
import {
  getMiniMaxApiKeyProtection,
  hasMiniMaxApiKey,
  miniMaxApiKeyEnvelopeFile
} from './minimax-api-key-store'
import { savedCredentialUnreadable } from '../credentials/saved-credential-readability'
import { getMainHttpClient } from '../network/http-client'
import type { MiniMaxCredentialsStatus } from '../../shared/minimax-credentials-status'

export function getMiniMaxCredentialsStatus(): MiniMaxCredentialsStatus {
  const cookieConfigured = hasMiniMaxSessionCookie()
  const apiKeyConfigured = hasMiniMaxApiKey()
  return {
    configured: cookieConfigured || apiKeyConfigured,
    cookieConfigured,
    apiKeyConfigured,
    cookieProtection: cookieConfigured ? getMiniMaxSessionCookieProtection() : null,
    apiKeyProtection: apiKeyConfigured ? getMiniMaxApiKeyProtection() : null,
    sessionCookieSupported: getMainHttpClient().partitionSession !== undefined,
    cookieUnreadable: cookieConfigured ? cookieUnreadable() : undefined,
    apiKeyUnreadable: apiKeyConfigured
      ? savedCredentialUnreadable(miniMaxApiKeyEnvelopeFile())
      : undefined
  }
}

function cookieUnreadable(): ReturnType<typeof savedCredentialUnreadable> {
  return savedCredentialUnreadable({
    path: getMiniMaxCookiePath(),
    envelopePrefix: COOKIE_ENVELOPE_PREFIX,
    legacyRaw: true
  })
}
