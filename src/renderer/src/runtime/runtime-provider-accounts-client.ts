import type { RateLimitState } from '../../../shared/rate-limit-types'
import type { RuntimeRpcResponse } from '../../../shared/runtime-rpc-envelope'
import type { RuntimeClientTarget } from '../../../shared/runtime-client-target'
import { RuntimeRpcCallError } from './runtime-rpc-result'

export type ProviderAccountsSnapshot = {
  rateLimits: RateLimitState | null
}

type ProviderAccountsSubscriptionMessage = {
  type: 'ready' | 'snapshot' | 'end'
  snapshot?: ProviderAccountsSnapshot
}

const REMOTE_ACCOUNTS_FIRST_SNAPSHOT_TIMEOUT_MS = 15_000

export type ProviderAccountsWatcher = {
  close: () => void
}

export function watchProviderAccounts(
  target: RuntimeClientTarget,
  handlers: {
    onSnapshot: (snapshot: ProviderAccountsSnapshot) => void
    onError: (error: unknown) => void
    onClosedAfterSnapshot?: () => void
  }
): ProviderAccountsWatcher {
  if (target.kind === 'local') {
    let closed = false
    void window.api.rateLimits
      .get()
      .then((rateLimits) => {
        if (!closed) {
          handlers.onSnapshot({ rateLimits })
        }
      })
      .catch((error: unknown) => {
        if (!closed) {
          handlers.onError(error)
        }
      })
    return {
      close: () => {
        closed = true
      }
    }
  }

  let closed = false
  let unsubscribe: (() => void) | null = null
  let receivedSnapshot = false
  const firstSnapshotTimer = window.setTimeout(() => {
    if (!closed && !receivedSnapshot) {
      handlers.onError(new Error('Timed out waiting for remote provider usage.'))
    }
  }, REMOTE_ACCOUNTS_FIRST_SNAPSHOT_TIMEOUT_MS)

  void window.api.runtimeEnvironments
    .subscribe(
      {
        selector: target.environmentId,
        method: 'accounts.subscribe',
        timeoutMs: REMOTE_ACCOUNTS_FIRST_SNAPSHOT_TIMEOUT_MS
      },
      {
        onResponse: (response) => {
          if (closed) {
            return
          }
          const typed = response as RuntimeRpcResponse<ProviderAccountsSubscriptionMessage>
          if (typed.ok === false) {
            handlers.onError(new RuntimeRpcCallError(typed))
            return
          }
          const message = typed.result
          if ((message.type === 'ready' || message.type === 'snapshot') && message.snapshot) {
            receivedSnapshot = true
            handlers.onSnapshot(message.snapshot)
          }
        },
        onError: (error) => {
          if (!closed) {
            handlers.onError(new Error(error.message))
          }
        },
        onClose: () => {
          if (closed) {
            return
          }
          if (!receivedSnapshot) {
            handlers.onError(new Error('Remote provider usage subscription closed.'))
          } else {
            handlers.onClosedAfterSnapshot?.()
          }
        }
      }
    )
    .then((handle) => {
      unsubscribe = handle.unsubscribe
      if (closed) {
        unsubscribe()
      }
    })
    .catch((error: unknown) => {
      if (!closed) {
        handlers.onError(error)
      }
    })

  return {
    close: () => {
      closed = true
      window.clearTimeout(firstSnapshotTimer)
      unsubscribe?.()
    }
  }
}
