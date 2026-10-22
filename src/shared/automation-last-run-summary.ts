import type { AutomationRun, AutomationRunStatus } from './automations-types'

export type AutomationLastRunSummary = {
  status: AutomationRunStatus | null
  at: number | null
}

/** Selects the newest retained run without transferring run history. */
export function summarizeAutomationLastRun(
  runs: readonly AutomationRun[]
): AutomationLastRunSummary {
  let latest: AutomationRun | null = null

  for (const run of runs) {
    if (!latest || run.createdAt > latest.createdAt) {
      latest = run
    }
  }

  return {
    status: latest?.status ?? null,
    at: latest ? (latest.dispatchedAt ?? latest.startedAt ?? latest.createdAt ?? null) : null
  }
}
