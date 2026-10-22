import { defineMethod, defineStreamingMethod } from '../core'
import {
  AccountsUnsubscribeParams,
  ListAccountsParams
} from '../../../../shared/rpc-contract/accounts-params'

// Why: monotonically increasing per-process counter avoids the Date.now()
// collision that fired when two near-simultaneous accounts.subscribe calls
// collided on the same millisecond and one evicted the other through
// registerSubscriptionCleanup's existing-key eviction path.
let accountsSubscriptionSeq = 0

export const ACCOUNT_METHODS = [
  defineMethod({
    name: 'accounts.list',
    permission: 'workspace',
    params: ListAccountsParams,
    handler: async (params, { runtime }) => {
      // Refresh usage on request because desktop polling pauses while unfocused.
      if (params.refreshUsage) {
        await runtime.refreshAccountsForMobile()
      }
      return runtime.getAccountsSnapshot()
    }
  }),
  // Why: streaming counterpart so mobile usage bars refresh in place when the
  // desktop's 5-minute rate-limit poll completes or when the user switches
  // accounts on either side. Mirrors the notifications.subscribe pattern.
  defineStreamingMethod({
    name: 'accounts.subscribe',
    permission: 'workspace',
    params: null,
    handler: async (_params, { runtime, connectionId }, emit) => {
      await new Promise<void>((resolve) => {
        const unsubscribe = runtime.onAccountsChanged((snapshot) => {
          emit({ type: 'snapshot', snapshot })
        })

        // Why: scope the id by connectionId so two sockets from the same
        // device (host + accounts screen) cannot evict each other through
        // registerSubscriptionCleanup's "existing key" branch, and append a
        // per-process counter so two concurrent subscribes on the same
        // socket also can't collide.
        const seq = ++accountsSubscriptionSeq
        const subscriptionId = `accounts-${connectionId ?? 'inproc'}-${seq}`
        runtime.registerSubscriptionCleanup(
          subscriptionId,
          () => {
            unsubscribe()
            emit({ type: 'end' })
            resolve()
          },
          connectionId
        )

        // Emit the current usage snapshot immediately, then refresh stale data.
        // Connection cutovers replay this subscription and must not turn the
        // manual-force lane into an unbounded provider-fetch loop.
        emit({ type: 'ready', subscriptionId, snapshot: runtime.getAccountsSnapshot() })
        void runtime.refreshAccountsForMobileSubscriber()
      })
    }
  }),
  defineMethod({
    name: 'accounts.unsubscribe',
    permission: 'workspace',
    params: AccountsUnsubscribeParams,
    handler: async (params, { runtime }) => {
      runtime.cleanupSubscription(params.subscriptionId)
      return { unsubscribed: true }
    }
  })
]
