import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CrashReportRecord } from '../../shared/crash-reporting'

const { handlers, listeners, clipboardWriteTextMock, recordCrashBreadcrumbMock, startSpanMock } =
  vi.hoisted(() => ({
    handlers: new Map<string, (_event: unknown, args?: unknown) => unknown>(),
    listeners: new Map<string, (_event: unknown, args?: unknown) => void>(),
    clipboardWriteTextMock: vi.fn(),
    recordCrashBreadcrumbMock: vi.fn(),
    startSpanMock: vi.fn(() => ({
      traceId: 'trace-id',
      spanId: 'span-id',
      setAttribute: vi.fn(),
      addEvent: vi.fn(),
      fail: vi.fn(),
      interrupt: vi.fn(),
      end: vi.fn()
    }))
  }))

vi.mock('electron', () => ({
  app: { getVersion: () => '1.2.3-test' },
  clipboard: { writeText: clipboardWriteTextMock },
  ipcMain: {
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
    handle: vi.fn((channel: string, handler: (_event: unknown, args?: unknown) => unknown) => {
      handlers.set(channel, handler)
    }),
    removeAllListeners: vi.fn((channel: string) => listeners.delete(channel)),
    on: vi.fn((channel: string, listener: (_event: unknown, args?: unknown) => void) => {
      listeners.set(channel, listener)
    })
  }
}))

vi.mock('../crash-reporting/crash-breadcrumb-store', () => ({
  getCrashBreadcrumbSnapshot: vi.fn(() => []),
  recordCoalescedCrashBreadcrumb: vi.fn(),
  recordCrashBreadcrumb: (...args: unknown[]) => recordCrashBreadcrumbMock(...args)
}))

vi.mock('../observability/tracer', () => ({ startSpan: startSpanMock }))

import { _resetRendererErrorReportDedupeForTests, registerCrashReportingHandlers } from './crash-reporting'

function report(status: CrashReportRecord['status'] = 'pending', id = 'crash-1'): CrashReportRecord {
  return {
    id,
    createdAt: '2026-05-16T01:00:00.000Z',
    status,
    source: 'renderer',
    processType: 'renderer',
    reason: 'crashed',
    exitCode: 5,
    appVersion: '1.0.0',
    platform: process.platform,
    osRelease: 'test',
    arch: process.arch,
    electronVersion: '41',
    chromeVersion: '141',
    details: {}
  }
}

describe('local crash-report handlers', () => {
  beforeEach(() => {
    handlers.clear()
    listeners.clear()
    clipboardWriteTextMock.mockReset()
    recordCrashBreadcrumbMock.mockReset()
    startSpanMock.mockClear()
    _resetRendererErrorReportDedupeForTests()
  })

  it('copies a selected captured report and redacts user notes', async () => {
    const captured = report()
    registerCrashReportingHandlers({
      getById: vi.fn(async () => captured),
      dismiss: vi.fn(),
      listRecent: vi.fn(async () => [captured]),
      getLatestPending: vi.fn(async () => captured),
      record: vi.fn()
    } as never)

    const result = await handlers.get('crashReports:copyLatestDiagnostics')?.(null, {
      reportId: captured.id,
      notes: 'extra /Users/alice/project'
    })

    expect(result).toEqual({ ok: true })
    expect(clipboardWriteTextMock).toHaveBeenCalledWith(expect.stringContaining('Report ID: crash-1'))
    expect(clipboardWriteTextMock).toHaveBeenCalledWith(expect.stringContaining('[redacted-path]'))
  })

  it('creates local copy text when the caller intentionally omits a report ID', async () => {
    const pending = report('pending', 'crash-late-pending')
    const getLatestPending = vi.fn(async () => pending)
    registerCrashReportingHandlers({
      getById: vi.fn(async () => null),
      dismiss: vi.fn(),
      listRecent: vi.fn(async () => [pending]),
      getLatestPending,
      record: vi.fn()
    } as never)

    await handlers.get('crashReports:copyLatestDiagnostics')?.(null, { notes: 'manual report' })

    expect(clipboardWriteTextMock).toHaveBeenCalledWith(expect.stringContaining('not captured'))
    expect(getLatestPending).not.toHaveBeenCalled()
  })

  it('returns dismissed reports for local review while pending lookup stays separate', async () => {
    const dismissed = report('dismissed', 'crash-dismissed')
    const pending = report('pending', 'crash-pending')
    registerCrashReportingHandlers({
      getById: vi.fn(async () => dismissed),
      dismiss: vi.fn(),
      listRecent: vi.fn(async () => [report('sent', 'crash-sent'), dismissed, pending]),
      getLatestPending: vi.fn(async () => pending),
      record: vi.fn()
    } as never)

    await expect(handlers.get('crashReports:getLatestPending')?.(null)).resolves.toEqual(pending)
    await expect(handlers.get('crashReports:getLatestReport')?.(null)).resolves.toEqual(dismissed)
  })

  it('dismisses a report locally without a submission side effect', async () => {
    const dismissed = report('dismissed')
    const dismiss = vi.fn(async () => dismissed)
    registerCrashReportingHandlers({
      getById: vi.fn(),
      dismiss,
      listRecent: vi.fn(),
      getLatestPending: vi.fn(),
      record: vi.fn()
    } as never)

    await expect(handlers.get('crashReports:dismiss')?.(null, { reportId: dismissed.id })).resolves.toBe(
      dismissed
    )
    expect(dismiss).toHaveBeenCalledWith(dismissed.id)
  })
})
