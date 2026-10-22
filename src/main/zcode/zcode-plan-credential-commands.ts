/** GLM Coding Plan credential status and storage-read diagnostics for this host. */
import {
  getZcodePlanApiKeyProtection,
  hasZcodePlanApiKey,
  API_KEY_ENVELOPE_PREFIX,
  getZcodePlanApiKeyPath
} from './zcode-plan-api-key-store'
import { savedCredentialUnreadable } from '../credentials/saved-credential-readability'
import { hasZcodeCliPlanCredentials } from '../rate-limits/zcode-usage-fetcher'
import type { ZcodePlanCredentialsStatus } from '../../shared/zcode-plan-sites'

export function getZcodePlanCredentialsStatus(): ZcodePlanCredentialsStatus {
  const apiKeyConfigured = hasZcodePlanApiKey()
  return {
    apiKeyConfigured,
    zcodeCliConfigured: hasZcodeCliPlanCredentials(),
    apiKeyProtection: getZcodePlanApiKeyProtection(),
    apiKeyUnreadable: apiKeyConfigured ? apiKeyUnreadable() : undefined
  }
}

function apiKeyUnreadable(): ReturnType<typeof savedCredentialUnreadable> {
  return savedCredentialUnreadable({
    path: getZcodePlanApiKeyPath(),
    envelopePrefix: API_KEY_ENVELOPE_PREFIX
  })
}
