import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createDeferred,
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

const { browserWindowMock, starOrcaMock } = mocks
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

  it('completes direct-star after a successful GitHub request', async () => {
    const window = createWindow()
    browserWindowMock.getAllWindows.mockReturnValue([window])
    const { service, ui } = createHarness()

    service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    const ok = await getIpcHandler('star-nag:starOrca')()

    expect(ok).toBe(true)
    expect(ui.starNagCompleted).toBe(true)
  })

  it('completes direct star when it resolves after dismissal cleared the visible session', async () => {
    const window = createWindow()
    browserWindowMock.getAllWindows.mockReturnValue([window])
    const deferredStar = createDeferred<boolean>()
    starOrcaMock.mockReturnValue(deferredStar.promise)
    const { service, ui } = createHarness()

    service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    const starPromise = getIpcHandler('star-nag:starOrca')()
    getIpcHandler('star-nag:dismiss')()

    deferredStar.resolve(true)
    await expect(starPromise).resolves.toBe(true)

    expect(ui.starNagCompleted).toBe(true)
  })

  it('preserves the cooldown after direct star fails following dismissal', async () => {
    const window = createWindow()
    browserWindowMock.getAllWindows.mockReturnValue([window])
    const deferredStar = createDeferred<boolean>()
    starOrcaMock.mockReturnValue(deferredStar.promise)
    const { service, ui } = createHarness()

    service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    const starPromise = getIpcHandler('star-nag:starOrca')()
    getIpcHandler('star-nag:dismiss')()

    deferredStar.resolve(false)
    await expect(starPromise).resolves.toBe(false)

    expect(ui.starNagCompleted).toBeUndefined()
    expect(ui.starNagDeferredUntil).toBeGreaterThan(Date.now())
    expect(window.webContents.send).toHaveBeenCalledTimes(1)
  })

  it('clears the in-flight direct-star guard after thrown attempts so the user can retry', async () => {
    const window = createWindow()
    browserWindowMock.getAllWindows.mockReturnValue([window])
    starOrcaMock.mockRejectedValueOnce(new Error('gh failed')).mockResolvedValueOnce(true)
    const { service, ui } = createHarness()

    service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    const starFromNag = getIpcHandler('star-nag:starOrca')

    await expect(starFromNag()).rejects.toThrow('gh failed')
    await expect(starFromNag()).resolves.toBe(true)

    expect(starOrcaMock).toHaveBeenCalledTimes(2)
    expect(ui.starNagCompleted).toBe(true)
  })

  it('guards duplicate in-flight attempts before web fallback', async () => {
    const window = createWindow()
    browserWindowMock.getAllWindows.mockReturnValue([window])
    const deferredStar = createDeferred<boolean>()
    starOrcaMock.mockReturnValue(deferredStar.promise)
    const { service, ui } = createHarness()

    service.registerIpcHandlers()
    getIpcHandler('star-nag:forceShow')()
    const starFromNag = getIpcHandler('star-nag:starOrca')
    const first = starFromNag()
    const second = starFromNag()

    deferredStar.resolve(false)
    await expect(first).resolves.toBe(false)
    await expect(second).resolves.toBe(false)

    expect(starOrcaMock).toHaveBeenCalledTimes(1)

    getIpcHandler('star-nag:openWeb')()

    expect(ui.starNagCompleted).toBeUndefined()
    expect(ui.starNagDeferredUntil).toBeGreaterThan(Date.now())
  })
})
