import { useEffect, useRef, useState } from 'react'
import type { ZcodePlanCredentialsStatus } from '../../../../shared/zcode-plan-sites'
import type { RuntimeClientTarget } from '../../../../shared/runtime-client-target'
import { callZcodePlanCredentials } from '@/runtime/runtime-usage-credentials-client'
import {
  usageCredentialAccessAfterError,
  type UsageCredentialAccess
} from './usage-credential-host'

const LOCAL_OWNER: RuntimeClientTarget = { kind: 'local' }

/** Read GLM plan credential status from `owner`; key the component by owner. */
export function useZcodePlanCredentials(
  updatedAt: number | undefined,
  owner: RuntimeClientTarget = LOCAL_OWNER
) {
  const [status, setStatus] = useState<ZcodePlanCredentialsStatus | null>(null)
  const [access, setAccess] = useState<UsageCredentialAccess>(
    owner.kind === 'local' ? 'ready' : 'checking'
  )
  const readGeneration = useRef(0)

  const ownerEnvironmentId = owner.kind === 'environment' ? owner.environmentId : null

  useEffect(() => {
    const request = ++readGeneration.current
    const readTarget: RuntimeClientTarget = ownerEnvironmentId
      ? { kind: 'environment', environmentId: ownerEnvironmentId }
      : LOCAL_OWNER
    void callZcodePlanCredentials(readTarget).then(
      (next) => {
        if (request === readGeneration.current) {
          setStatus(next)
          setAccess('ready')
        }
      },
      (error: unknown) => {
        if (request === readGeneration.current) {
          setStatus(null)
          setAccess(ownerEnvironmentId ? usageCredentialAccessAfterError(error) : 'ready')
        }
      }
    )
    return () => {
      readGeneration.current += 1
    }
  }, [updatedAt, ownerEnvironmentId])

  return { status, access }
}
