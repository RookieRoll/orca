import { useEffect, useState } from 'react'
import type { MiniMaxCredentialsStatus } from '../../../../shared/minimax-credentials-status'
import type { RuntimeClientTarget } from '../../../../shared/runtime-client-target'
import { callMiniMaxCredentials } from '@/runtime/runtime-usage-credentials-client'
import {
  usageCredentialAccessAfterError,
  type UsageCredentialAccess
} from './usage-credential-host'

/** Read MiniMax credential status from `owner`; key the component by owner. */
export function useMiniMaxCredentials(owner: RuntimeClientTarget) {
  const [status, setStatus] = useState<MiniMaxCredentialsStatus | null>(null)
  const [access, setAccess] = useState<UsageCredentialAccess>(
    owner.kind === 'local' ? 'ready' : 'checking'
  )

  const ownerEnvironmentId = owner.kind === 'environment' ? owner.environmentId : null
  useEffect(() => {
    let current = true
    const target: RuntimeClientTarget = ownerEnvironmentId
      ? { kind: 'environment', environmentId: ownerEnvironmentId }
      : { kind: 'local' }
    void callMiniMaxCredentials(target).then(
      (next) => {
        if (current) {
          setStatus(next)
          setAccess('ready')
        }
      },
      (error: unknown) => {
        console.error('Failed to load MiniMax credential status:', error)
        if (current) {
          setAccess(ownerEnvironmentId ? usageCredentialAccessAfterError(error) : 'ready')
        }
      }
    )
    return () => {
      current = false
    }
  }, [ownerEnvironmentId])

  return {
    access,
    miniMaxConfigured: status?.cookieConfigured === true,
    miniMaxCookieProtection: status?.cookieProtection ?? null,
    miniMaxApiKeyConfigured: status?.apiKeyConfigured === true,
    miniMaxApiKeyProtection: status?.apiKeyProtection ?? null
  }
}
