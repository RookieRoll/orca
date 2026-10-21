import type { PreparedCheckoutOrigin } from '../shared/worktree/create-types'

/** Local timing details for the prepared checkout used by a create. */
export type PreparationActivity = {
  /** An explicit prefetch asked for this checkout too. */
  requestedByPrefetch(): void
  /** Covers `ready`, the checkout's latest build or tip refresh, until it settles. */
  track(ready: Promise<void>): void
  origin(): PreparedCheckoutOrigin
  /** First build's duration, and how long the checkout sat ready before `claimedAt`. */
  timesAt(claimedAt: number): { buildMs: number; idleMs: number }
}

export function createPreparationActivity(kind: 'explicit' | 'automatic'): PreparationActivity {
  // Build: from the first build's start (including any wait for the base fetch it is built on)
  // to its first ready; a later tip refresh does not restart it.
  const buildStartedAt = performance.now()
  let buildFinishedAt: number | undefined
  // Idle: measured from the latest ready, build or refresh, to the claim.
  let latestReadyAt: number | undefined
  let latest: Promise<void> | undefined
  let prefetchRequested = false

  return {
    requestedByPrefetch() {
      prefetchRequested = true
    },
    track(ready) {
      latest = ready
      latestReadyAt = undefined
      const settle = (succeeded: boolean): void => {
        const now = performance.now()
        if (succeeded) {
          buildFinishedAt ??= now
        }
        // A refresh chained onto this work extends it; only the latest settle ends it.
        if (latest !== ready) {
          return
        }
        if (succeeded) {
          latestReadyAt = now
        }
      }
      void ready.then(
        () => settle(true),
        () => settle(false)
      )
    },
    origin() {
      if (kind === 'explicit') {
        return 'prefetch'
      }
      return prefetchRequested ? 'rearm_then_prefetch' : 'rearm'
    },
    timesAt(claimedAt) {
      // A create that waited for the work reports no idle time.
      return {
        buildMs: Math.max(0, (buildFinishedAt ?? claimedAt) - buildStartedAt),
        idleMs: Math.max(0, claimedAt - (latestReadyAt ?? claimedAt))
      }
    }
  }
}
