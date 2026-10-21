import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = await vi.hoisted(async () => {
  const { createGitHubIpcMocks } = await import('./github-ipc-module-mocks')
  return createGitHubIpcMocks()
})

vi.mock('electron', () => mocks.electron)
vi.mock('../github/client', () => mocks.client)
vi.mock('../github/work-item-details', () => mocks.workItemDetails)
vi.mock('../github/pr-refresh-coordinator', () => mocks.prRefresh)
vi.mock('./ui', () => mocks.ui)

import { registerGitHubHandlers } from './github'
import { createGitHubIpcHarness } from './github-ipc-test-harness'

const { getAuthenticatedViewer: getAuthenticatedViewerMock, starOrca: starOrcaMock } = mocks.client

describe('GitHub account IPC handlers', () => {
  const harness = createGitHubIpcHarness(mocks)
  const { handlers, store, stats } = harness

  beforeEach(harness.reset)

  it('forwards the authenticated viewer lookup', async () => {
    getAuthenticatedViewerMock.mockResolvedValue({ login: 'octocat', email: 'octocat@example.com' })

    registerGitHubHandlers(store as never, stats as never)

    await expect(handlers['gh:viewer'](null, undefined)).resolves.toEqual({
      login: 'octocat',
      email: 'octocat@example.com'
    })
    expect(getAuthenticatedViewerMock).toHaveBeenCalled()
  })

  it('forwards the star action result', async () => {
    starOrcaMock.mockResolvedValue(true)

    registerGitHubHandlers(store as never, stats as never)

    await expect(handlers['gh:starOrca'](null, undefined)).resolves.toBe(true)
    expect(starOrcaMock).toHaveBeenCalledTimes(1)
  })

  it('propagates a star action failure', async () => {
    starOrcaMock.mockRejectedValue(new Error('gh failed'))

    registerGitHubHandlers(store as never, stats as never)

    await expect(handlers['gh:starOrca'](null, undefined)).rejects.toThrow('gh failed')
  })
})
