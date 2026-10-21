import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createProfileStateStoreForStartupMock,
  logMock,
  ensureActiveOrcaProfileMock,
  initOrcaProfilePathsMock,
  initSshHostKeyStoreFileMock
} = vi.hoisted(() => ({
  createProfileStateStoreForStartupMock: vi.fn(),
  logMock: vi.fn(),
  ensureActiveOrcaProfileMock: vi.fn(),
  initOrcaProfilePathsMock: vi.fn(),
  initSshHostKeyStoreFileMock: vi.fn()
}))

vi.mock('../persistence/profile-state/profile-state-startup-authority', () => ({
  createProfileStateStoreForStartup: createProfileStateStoreForStartupMock
}))
vi.mock('../orca-profiles/profile-index-store', () => ({
  ensureActiveOrcaProfile: ensureActiveOrcaProfileMock,
  initOrcaProfilePaths: initOrcaProfilePathsMock
}))
vi.mock('../ssh/ssh-host-key-store', () => ({
  initSshHostKeyStoreFile: initSshHostKeyStoreFileMock
}))
vi.mock('./orcad-profile-state-diagnostics', () => ({
  logOrcadProfileStateAuthorityDiagnostic: logMock
}))
const { createOrcadProfileStateStartup } = await import('./orcad-profile-state-startup')

beforeEach(() => {
  vi.resetAllMocks()
  ensureActiveOrcaProfileMock.mockReturnValue({
    dataFile: '/tmp/profile/orca-data.json',
    stateDatabaseFile: '/tmp/profile/profile-state.db',
    profile: { id: 'profile-1' }
  })
})

describe('orcad profile-state startup', () => {
  it('selects and returns the profile-state authority', async () => {
    const store = { getSettings: vi.fn() }
    createProfileStateStoreForStartupMock.mockReturnValue({
      store,
      authority: { readSerializedState: vi.fn() },
      backend: 'sqlite',
      classification: 'json-only',
      migrated: true
    })

    const result = await createOrcadProfileStateStartup('/tmp/user-data')

    expect(initOrcaProfilePathsMock).toHaveBeenCalledOnce()
    expect(ensureActiveOrcaProfileMock).toHaveBeenCalledWith('/tmp/user-data')
    expect(initSshHostKeyStoreFileMock).toHaveBeenCalledWith('/tmp/profile/orca-data.json')

    expect(createProfileStateStoreForStartupMock).toHaveBeenCalledWith({
      dataFile: '/tmp/profile/orca-data.json',
      databaseFile: '/tmp/profile/profile-state.db',
      profileId: 'profile-1',
      runtime: 'orcad',
      storageAuthority: 'runtime'
    })
    expect(result.store).toBe(store)
    expect(result.authority).toEqual({
      backend: 'sqlite',
      classification: 'json-only',
      authority_mode: 'sqlite-established',
      runtime: 'orcad',
      migrated: true
    })
    expect(logMock).toHaveBeenCalledWith(result.authority)
  })

  it('does not initialize sidecars before the profile writer is ready', async () => {
    let refuse = (_error: Error) => {}
    createProfileStateStoreForStartupMock.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          refuse = reject
        })
    )
    const startup = createOrcadProfileStateStartup('/tmp/user-data')
    const failure = new Error('writer startup refused')
    const rejected = expect(startup).rejects.toBe(failure)
    expect(initSshHostKeyStoreFileMock).not.toHaveBeenCalled()
    expect(logMock).not.toHaveBeenCalled()
    refuse(failure)
    await rejected
  })

  it('closes a ready writer if sidecar initialization fails', async () => {
    const store = { freezeWritesAsync: vi.fn(async () => {}) }
    createProfileStateStoreForStartupMock.mockResolvedValueOnce({
      store,
      backend: 'sqlite',
      classification: 'sqlite-only',
      migrated: false
    })
    const failure = new Error('sidecar initialization refused')
    initSshHostKeyStoreFileMock.mockImplementationOnce(() => {
      throw failure
    })
    await expect(createOrcadProfileStateStartup('/tmp/user-data')).rejects.toBe(failure)
    expect(store.freezeWritesAsync).toHaveBeenCalledOnce()
    expect(logMock).not.toHaveBeenCalled()
  })
})
