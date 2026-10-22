import type { MiniMaxCredentialsStatus } from '../../../shared/minimax-credentials-status'
import type { ZcodePlanCredentialsStatus } from '../../../shared/zcode-plan-sites'
import type { RuntimeClientTarget } from '../../../shared/runtime-client-target'
import { USAGE_CREDENTIALS_RUNTIME_CAPABILITY } from '../../../shared/account-runtime-capabilities'
import { callRuntimeRpc, runtimeEnvironmentSupportsCapability } from './runtime-rpc-client'
import { RuntimeRpcCallError } from './runtime-rpc-result'

const HOST_CREDENTIAL_TIMEOUT_MS = 20_000

/** The selected host predates the usage-credential status RPC. */
export class UsageCredentialsHostOutdatedError extends Error {
  constructor() {
    super('This host cannot report usage credential status.')
    this.name = 'UsageCredentialsHostOutdatedError'
  }
}

async function callHost<TResult>(
  environmentId: string,
  method: string,
  params?: unknown
): Promise<TResult> {
  // Why never local on refusal: that would report the wrong host's status.
  if (
    !(await runtimeEnvironmentSupportsCapability(
      environmentId,
      USAGE_CREDENTIALS_RUNTIME_CAPABILITY
    ))
  ) {
    throw new UsageCredentialsHostOutdatedError()
  }
  try {
    return await callRuntimeRpc<TResult>({ kind: 'environment', environmentId }, method, params, {
      timeoutMs: HOST_CREDENTIAL_TIMEOUT_MS
    })
  } catch (error) {
    if (error instanceof RuntimeRpcCallError && error.code === 'method_not_found') {
      throw new UsageCredentialsHostOutdatedError()
    }
    throw error
  }
}

export function callMiniMaxCredentials(
  owner: RuntimeClientTarget
): Promise<MiniMaxCredentialsStatus> {
  if (owner.kind === 'local') {
    return window.api.minimaxCredentials.getStatus()
  }
  return callHost(owner.environmentId, 'accounts.minimaxCredentialsStatus')
}

export function callZcodePlanCredentials(
  owner: RuntimeClientTarget
): Promise<ZcodePlanCredentialsStatus> {
  if (owner.kind === 'local') {
    return window.api.zcodePlanCredentials.getStatus()
  }
  return callHost(owner.environmentId, 'accounts.zcodePlanCredentialsStatus')
}
