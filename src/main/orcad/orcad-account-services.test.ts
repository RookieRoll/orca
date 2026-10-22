import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Store } from '../persistence/loading-store/store'
import { ProfileStateSqliteAuthority } from '../persistence/profile-state/profile-state-sqlite-authority'
import { OrcaRuntimeService } from '../runtime/orca-runtime'
import { installFakeAppEnvironment } from '../../../config/scripts/vitest-host-ports-setup'
import { createOrcadAccountServices } from './orcad-account-services'
import type { OrcadRuntimeCleanup } from './orcad-runtime-lifetime'

const directories: string[] = []
const stores: Store[] = []
let cleanups: OrcadRuntimeCleanup[] = []

function tempDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'orcad-account-services-'))
  directories.push(directory)
  return directory
}

beforeEach(() => {
  // Why a temp home and userData: the account services resolve ~/.codex, ~/.claude and their
  // managed homes from these, and a test must never touch the developer's own.
  const home = tempDirectory()
  const userData = tempDirectory()
  vi.stubEnv('HOME', home)
  vi.stubEnv('USERPROFILE', home)
  // Why: the Codex runtime home reads this (as the host seeds it); otherwise XDG_CONFIG_HOME wins on CI.
  vi.stubEnv('ORCA_USER_DATA_PATH', userData)
  installFakeAppEnvironment({
    getPath: (name) => (name === 'home' ? home : name === 'temp' ? tmpdir() : userData)
  })
})

afterEach(async () => {
  for (const cleanup of cleanups.toReversed()) {
    await cleanup({ failed: false })
  }
  cleanups = []
  for (const store of stores.splice(0)) {
    store.freezeWrites()
  }
  vi.unstubAllEnvs()
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function createRuntime(): { runtime: OrcaRuntimeService; store: Store } {
  const directory = tempDirectory()
  const store = new Store({
    dataFile: join(directory, 'orca-data.json'),
    profileStateAuthority: new ProfileStateSqliteAuthority(
      join(directory, 'profile-state.db'),
      'orcad-account-services'
    )
  })
  stores.push(store)
  return { runtime: new OrcaRuntimeService(store), store }
}

const CLIENT_HOME = '/home/user/.local/share/orca/codex-accounts/client-account/home'

function create(store: Store, isWslHost: boolean): ReturnType<typeof createOrcadAccountServices> {
  // Stands in for orcadCodexAccountHomes: only CLIENT_HOME is a client-owned account home.
  const clientHome = (launchEnv?: NodeJS.ProcessEnv): string | null =>
    launchEnv?.CODEX_HOME === CLIENT_HOME ? CLIENT_HOME : null
  return createOrcadAccountServices({
    store,
    setClaudeStatusLineListener: vi.fn(),
    registerCleanup: (cleanup) => cleanups.push(cleanup),
    clientCodexHomes: {
      selectLaunchHome: async (_target, launchEnv) => clientHome(launchEnv),
      readLaunchHome: clientHome
    },
    isWslHost: () => isWslHost
  })
}

describe('orcad account services', () => {
  it('resolves structured Codex launches to a client-sent home, else the default CLI home', async () => {
    const { store } = createRuntime()
    const services = create(store, false)
    if (!services) {
      throw new Error('expected account services on a non-WSL host')
    }
    const { prepareCodexStructuredLaunch, resolveCodexStructuredLaunchHome } = services.runtimeDeps
    const clientEnv = { CODEX_HOME: CLIENT_HOME }

    await expect(prepareCodexStructuredLaunch({ launchEnv: clientEnv })).resolves.toBe(CLIENT_HOME)
    expect(resolveCodexStructuredLaunchHome({ launchEnv: clientEnv })).toBe(CLIENT_HOME)
    // Null means the ordinary ~/.codex; it is not a failed home lookup.
    await expect(prepareCodexStructuredLaunch({ launchEnv: {} })).resolves.toBeNull()
    expect(resolveCodexStructuredLaunchHome({ launchEnv: {} })).toBeNull()
    expect(services.listCodexSessionHomes()).toEqual(expect.any(Array))
  })

  it('prepares automatic Codex resumes on this host, but not for a client-sent home', async () => {
    const { store } = createRuntime()
    const services = create(store, false)
    if (!services) {
      throw new Error('expected account services on a non-WSL host')
    }
    const resume = (launchEnv: NodeJS.ProcessEnv) =>
      services.prepareCodexSessionResume({
        providerSession: { key: 'session_id', id: '019a0000-0000-7000-8000-000000000000' },
        target: { runtime: 'host' },
        launchEnv
      })

    await expect(resume({ CODEX_HOME: CLIENT_HOME })).resolves.toBeNull()
    // No trusted home records the session, so the pane starts fresh instead of resuming blind.
    await expect(resume({})).resolves.toMatchObject({ outcome: 'fresh' })
  })

})
