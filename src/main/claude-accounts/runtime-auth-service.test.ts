import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDefaultSettings } from '../../shared/constants'
import type { GlobalSettings } from '../../shared/global-settings-types'

const fakes = vi.hoisted(() => ({
  host: {
    prepareLaunch: async () => {},
    systemDefaultHome: () => '/host/.claude'
  }
}))
vi.mock('../wsl', () => ({
  getDefaultWslDistro: () => 'Ubuntu',
  getWslHome: (distro: string) => `/wsl/${distro}/home`
}))
vi.mock('./claude-cli-home-resolver', () => ({
  ClaudeCliHomeResolver: function ClaudeCliHomeResolver() {
    return fakes.host
  },
  installClaudeCliHomeResolver: () => {}
}))

import { ClaudeRuntimeAuthService } from './runtime-auth-service'

const platform = Object.getOwnPropertyDescriptor(process, 'platform')!
function service(
  platformName: NodeJS.Platform,
  overrides: Partial<GlobalSettings> = {},
  isDistroRunning: (distro: string) => Promise<boolean> = async () => true
) {
  Object.defineProperty(process, 'platform', { configurable: true, value: platformName })
  const settings = { ...getDefaultSettings('/home/user'), ...overrides }
  return new ClaudeRuntimeAuthService({ getSettings: () => settings }, isDistroRunning)
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  Object.defineProperty(process, 'platform', platform)
  vi.restoreAllMocks()
})

describe('ClaudeRuntimeAuthService', () => {
  it('skips a quota preparation for a stopped distro instead of booting it', async () => {
    const auth = service('win32', {}, async () => false)
    await expect(
      auth.prepareForRateLimitFetch({ runtime: 'wsl', wslDistro: 'Ubuntu' })
    ).resolves.toMatchObject({
      provenance: 'wsl:unavailable',
      usageError: 'WSL distro Ubuntu is not running.'
    })

    const running = service('win32')
    await expect(
      running.prepareForRateLimitFetch({ runtime: 'wsl', wslDistro: 'Ubuntu' })
    ).resolves.toMatchObject({
      runtime: 'wsl',
      wslDistro: 'Ubuntu',
      wslLinuxConfigDir: '/wsl/Ubuntu/home/.claude',
      provenance: 'wsl:Ubuntu'
    })
  })

  it('keeps a stale WSL account setting on the host off Windows', async () => {
    const auth = service('darwin', { localAccountRuntime: 'wsl', localAccountWslDistro: 'Ubuntu' })
    expect(auth.getRuntimeConfigDir()).toBe('/host/.claude')
    await expect(auth.prepareForClaudeLaunch()).resolves.toMatchObject({
      configDir: '/host/.claude',
      runtime: 'host',
      provenance: 'system'
    })
  })

  it('routes a WSL target that names no distro to the default distro', async () => {
    const auth = service('win32')
    await expect(auth.prepareForClaudeLaunch({ runtime: 'wsl', wslDistro: null })).resolves.toMatchObject({
      runtime: 'wsl',
      wslDistro: 'Ubuntu'
    })
    expect(auth.getRuntimeConfigDir({ runtime: 'wsl', wslDistro: null })).toBe(
      '/wsl/Ubuntu/home/.claude'
    )
  })

})
