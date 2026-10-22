import { describe, expect, it } from 'vitest'
import type { AutomationRun } from './automations-types'
import { summarizeAutomationLastRun } from './automation-last-run-summary'

const makeRun = (overrides: Partial<AutomationRun> = {}): AutomationRun =>
  ({
    id: 'run-1',
    automationId: 'a1',
    title: 'Automation run',
    scheduledFor: 0,
    status: 'completed',
    trigger: 'scheduled',
    workspaceId: null,
    sessionKind: 'terminal',
    chatSessionId: null,
    terminalSessionId: null,
    terminalPaneKey: null,
    terminalPtyId: null,
    outputSnapshot: null,
    precheckResult: null,
    error: null,
    startedAt: null,
    dispatchedAt: null,
    createdAt: 0,
    ...overrides
  })

describe('summarizeAutomationLastRun', () => {
  it('projects the newest retained run status and timestamp', () => {
    expect(
      summarizeAutomationLastRun([
        makeRun({ createdAt: 1, status: 'completed', dispatchedAt: 11 }),
        makeRun({ createdAt: 3, status: 'dispatch_failed', dispatchedAt: 33 }),
        makeRun({ createdAt: 2, status: 'completed', dispatchedAt: 22 })
      ])
    ).toEqual({ status: 'dispatch_failed', at: 33 })
  })

  it('falls back through the newest run timestamps', () => {
    expect(
      summarizeAutomationLastRun([
        makeRun({ createdAt: 1, status: 'completed', dispatchedAt: 11 }),
        makeRun({ createdAt: 2, status: 'pending', startedAt: 22 })
      ])
    ).toEqual({ status: 'pending', at: 22 })
    expect(summarizeAutomationLastRun([makeRun({ createdAt: 3, status: 'pending' })])).toEqual({
      status: 'pending',
      at: 3
    })
  })

  it('returns an empty projection when there is no retained run', () => {
    expect(summarizeAutomationLastRun([])).toEqual({ status: null, at: null })
  })
})
