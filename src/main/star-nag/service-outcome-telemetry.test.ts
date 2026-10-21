import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createHarness,
  createIpcHandlerLookup,
  createWindow,
  resetStarNagMocks,
  type TestWindow
} from './service-test-harness'

const mocks = vi.hoisted(() => ({
  appMock: {
    getVersion: vi.fn(() => '1.2.3')
  },
  browserWindowMock: {
    getAllWindows: vi.fn<() => TestWindow[]>(() => [])
  },
  checkOrcaStarredMock: vi.fn(),
  starOrcaMock: vi.fn(),
  ipcMainHandleMock: vi.fn()
}))

vi.mock('electron', () => ({
  app: mocks.appMock,
  BrowserWindow: mocks.browserWindowMock,
  ipcMain: {
    handle: mocks.ipcMainHandleMock
  }
}))

vi.mock('../github/client', () => ({
  checkOrcaStarred: mocks.checkOrcaStarredMock,
  starOrca: mocks.starOrcaMock
}))

const { browserWindowMock, checkOrcaStarredMock, ipcMainHandleMock } = mocks
const getIpcHandler = createIpcHandlerLookup(mocks.ipcMainHandleMock)

describe('StarNagService', () => {
  let consoleInfoMock: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetStarNagMocks(mocks)
    consoleInfoMock = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleInfoMock.mockRestore()
  })

  it('updates cooldown and completion state for dismiss, disable, and web handoff', () => {
    const window = createWindow()
    browserWindowMock.getAllWindows.mockReturnValue([window])
    const dismissed = createHarness()

    dismissed.service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    getIpcHandler('star-nag:dismiss')()

    expect(dismissed.ui.starNagDeferredUntil).toBeGreaterThan(Date.now())
    ipcMainHandleMock.mockClear()
    const disabled = createHarness()
    disabled.service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    getIpcHandler('star-nag:disable')()

    expect(disabled.ui.starNagCompleted).toBe(true)

    ipcMainHandleMock.mockClear()
    const opened = createHarness()
    opened.service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    getIpcHandler('star-nag:openWeb')()

    expect(opened.ui.starNagCompleted).toBeUndefined()
    expect(opened.ui.starNagDeferredUntil).toBeGreaterThan(Date.now())
    expect(opened.ui.starNagNextThreshold).toBe(STAR_NAG_INITIAL_THRESHOLD * 2)
  })

  it('does not reapply web handoff after the prompt session has closed', () => {
    const window = createWindow()
    browserWindowMock.getAllWindows.mockReturnValue([window])
    const { service, store } = createHarness()

    service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    getIpcHandler('star-nag:openWeb')()
    const updatesAfterHandoff = store.updateUI.mock.calls.length
    getIpcHandler('star-nag:openWeb')()

    expect(store.updateUI).toHaveBeenCalledTimes(updatesAfterHandoff)
  })

  it('preserves cooldown state when a prompt is deferred', () => {
    const window = createWindow()
    browserWindowMock.getAllWindows.mockReturnValue([window])
    const later = createHarness()

    later.service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    getIpcHandler('star-nag:later')()

    expect(consoleInfoMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ event: 'star_nag_later' })
    )
    expect(later.ui.starNagCompleted).toBeUndefined()
    expect(later.ui.starNagDeferredUntil).toBeGreaterThan(Date.now())
  })

  it('keeps web fallback handoff incomplete and applies cooldown', async () => {
    const window = createWindow()
    browserWindowMock.getAllWindows.mockReturnValue([window])
    checkOrcaStarredMock.mockResolvedValue(null)
    const { service, ui } = createHarness()

    service.registerIpcHandlers()
    await getIpcHandler('star-nag:onboardingCompleted')()
    getIpcHandler('star-nag:openWeb')()

    expect(ui.starNagCompleted).toBeUndefined()
    expect(ui.starNagDeferredUntil).toBeGreaterThan(Date.now())
  })
})
