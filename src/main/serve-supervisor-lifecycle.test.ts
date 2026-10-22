import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BROWSER_SIDECAR_OWNER_ENV } from '../shared/browser-sidecar-lifetime'

const { appMock } = vi.hoisted(() => ({ appMock: { getVersion: vi.fn(() => '1.0.51'), quit: vi.fn() } }))

vi.mock('electron', () => ({ app: appMock }))

describe('serve supervisor lifecycle', () => {
  beforeEach(() => {
    vi.resetModules()
    appMock.quit.mockReset()
    vi.stubEnv(BROWSER_SIDECAR_OWNER_ENV, '1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('quits a browser sidecar when its CLI parent is lost', async () => {
    const listeners: (() => void)[] = []
    const parent = {
      connected: true,
      once: (_event: 'disconnect', listener: () => void) => listeners.push(listener),
      off: (_event: 'disconnect', listener: () => void) => {
        const index = listeners.indexOf(listener)
        if (index !== -1) listeners.splice(index, 1)
      }
    }
    const { installServeSupervisorDisconnectQuit } = await import('./serve-supervisor-lifecycle')

    const removeListener = installServeSupervisorDisconnectQuit(true, parent)
    listeners[0]?.()

    expect(appMock.quit).toHaveBeenCalledOnce()
    removeListener()
  })
})
