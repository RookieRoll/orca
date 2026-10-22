import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfileStateSqliteAuthority } from '../profile-state/profile-state-sqlite-authority'
import { readProfileStateDomain } from '../profile-state/profile-state-domain-reader'
import { buildProfileStateCutoverFixture } from '../profile-state-cutover-fixture'
import { Store } from './store'
import { hostWorktreeTarget } from '../../../shared/worktree/host-qualified-identity'

vi.mock('electron', () => ({
  app: {
    getPath: () => tmpdir(),
    getName: () => 'orca-test',
    getVersion: () => '0.0.0-test',
    isPackaged: false,
    on: () => {},
    whenReady: () => Promise.resolve()
  },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (value: string) => Buffer.from(`encrypted:${value}`),
    decryptString: (value: Buffer) => value.toString().slice('encrypted:'.length)
  },
  ipcMain: { on: () => {}, handle: () => {} },
  BrowserWindow: { getAllWindows: () => [] }
}))
vi.mock('../../ssh/config/ssh-config-parser', () => ({
  loadUserSshConfig: () => ({ hosts: [] }),
  sshConfigHostsToTargets: () => []
}))

const PROFILE_ID = 'direct-flush-test'
const fixtures: { directory: string; store: Store }[] = []

afterEach(async () => {
  for (const fixture of fixtures.splice(0)) {
    fixture.store.freezeWrites()
    await fixture.store.flushAsync()
    rmSync(fixture.directory, { recursive: true, force: true })
  }
  vi.restoreAllMocks()
})

function fixture(seedState?: unknown) {
  const directory = mkdtempSync(join(tmpdir(), 'orca-direct-flush-'))
  const databasePath = join(directory, 'profile-state.db')
  const authority = new ProfileStateSqliteAuthority(databasePath, PROFILE_ID)
  vi.spyOn(authority, 'scheduleBackup').mockImplementation(() => {})
  if (seedState !== undefined) {
    authority.writeSerializedState(Buffer.from(JSON.stringify(seedState)))
  }
  const store = new Store({
    dataFile: join(directory, 'orca-data.json'),
    profileStateAuthority: authority
  })
  fixtures.push({ directory, store })
  store.flushOrThrow()
  return {
    store,
    read: (domain: string) => readProfileStateDomain(databasePath, PROFILE_ID, domain)
  }
}

describe('SQLite durability barriers with another selective write pending', () => {
  it('deletes an automation and its retained runs in the same commit', () => {
    const state = fixture(buildProfileStateCutoverFixture())
    const automation = state.store.listAutomations()[0]
    if (!automation) {
      throw new Error('Fixture automation is absent')
    }
    expect(state.store.listAutomationRuns(automation.id)).not.toHaveLength(0)
    state.store.deleteAutomation(automation.id)
    expect(state.read('automations')).toMatchObject({ kind: 'value', value: [] })
    expect(state.read('automationRuns')).toMatchObject({ kind: 'value', value: [] })
  })

  it('persists the session and UI identities moved with worktree metadata', () => {
    const seed = buildProfileStateCutoverFixture()
    const oldId = 'repo-local::/fixture/local'
    const newId = 'repo-local::/fixture/renamed'
    seed.workspaceSession.activeWorktreeId = oldId
    seed.ui.showDotfilesByWorktree = { [oldId]: true }
    const state = fixture(seed)
    state.store.migrateWorktreeIdentity(hostWorktreeTarget({ id: oldId, hostId: 'local' }), newId)
    state.store.flushOrThrow()
    expect(state.read('workspaceSession')).toMatchObject({
      kind: 'value',
      value: { activeWorktreeId: newId }
    })
    expect(state.read('ui')).toMatchObject({
      kind: 'value',
      value: { showDotfilesByWorktree: { [newId]: true } }
    })
  })
})
