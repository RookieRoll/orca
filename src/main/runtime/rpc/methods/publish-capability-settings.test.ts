import { describe, expect, it, vi } from 'vitest'
import { getDefaultSettings } from '../../../../shared/constants'
import { SettingsUpdate } from '../../../../shared/rpc-contract/client-settings-params'
import { OrcaRuntimeService } from '../../orca-runtime'
import type { RuntimeStore } from '../../runtime-store-contract'

vi.mock('electron', () => ({
  app: { getPath: () => '/orca-state', isPackaged: true }
}))

const CAPABILITIES = ['agentSkillSharingEnabled'] as const

function runtimeWithSharing(
  capability: (typeof CAPABILITIES)[number],
  value: unknown
): OrcaRuntimeService {
  const store: Pick<RuntimeStore, 'getSettings'> = {
    getSettings: () => {
      const settings = getDefaultSettings('/tmp')
      // Persisted settings may contain non-booleans despite the declared schema.
      Reflect.set(settings, capability, value)
      return settings
    }
  }
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: construction and getClientSettings require only getSettings from this fixture.
  return new OrcaRuntimeService(store as RuntimeStore)
}

// A client may read the host's skill-publishing permission, but cannot grant it over RPC.
describe.each(CAPABILITIES)('%s cannot be granted over RPC', (capability) => {
  it('rejects settings.update attempts to enable it', () => {
    expect(SettingsUpdate.safeParse({ [capability]: true }).success).toBe(false)
  })

  it('publishes the capability read-only through settings.get', () => {
    expect(runtimeWithSharing(capability, true).getClientSettings()[capability]).toBe(true)
    expect(runtimeWithSharing(capability, false).getClientSettings()[capability]).toBe(false)
    expect(runtimeWithSharing(capability, undefined).getClientSettings()[capability]).toBe(false)
  })

  it('fails closed for truthy non-booleans', () => {
    expect(runtimeWithSharing(capability, 'yes').getClientSettings()[capability]).toBe(false)
  })
})

describe('retired artifact settings', () => {
  it('does not accept the removed cloud-publishing permission or navigation settings', () => {
    expect(SettingsUpdate.safeParse({ artifactSharingEnabled: true }).success).toBe(false)
    expect(SettingsUpdate.safeParse({ artifactsEnabled: true }).success).toBe(false)
    expect(SettingsUpdate.safeParse({ showArtifactsButton: true }).success).toBe(false)
    expect(SettingsUpdate.safeParse({ skipDeleteArtifactConfirm: true }).success).toBe(false)
  })

  it('still accepts an unrelated allowlisted setting', () => {
    expect(SettingsUpdate.safeParse({ compactWorktreeCards: true }).success).toBe(true)
  })
})
