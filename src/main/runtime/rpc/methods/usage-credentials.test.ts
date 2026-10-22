import '../unused-default-rpc-methods.test-fixture'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import type * as NodeOs from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrcaRuntimeService } from '../../orca-runtime'
import { setSecretStore } from '../../../../shared/secret-store'
import type { RpcRequest } from '../core'
import { RpcDispatcher } from '../dispatcher'
import { USAGE_CREDENTIAL_METHODS } from './usage-credentials'
import { API_KEY_ENVELOPE_PREFIX } from '../../../zcode/zcode-plan-api-key-store'
import { RuntimeAccountController } from '../../runtime-account-controller'

const home = vi.hoisted(() => ({ dir: '' }))
vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof NodeOs>()
  return { ...actual, homedir: () => home.dir }
})
// Why: the CLI sign-in probe reads platform credential stores this test must not touch.
vi.mock('../../../rate-limits/zcode-usage-fetcher', () => ({
  hasZcodeCliPlanCredentials: () => false
}))

function createRuntime() {
  const rateLimits = {
    refresh: vi.fn(() => Promise.resolve())
  }
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: these methods only read requireUsageRateLimits; the dispatcher only reads getRuntimeId.
  const runtime = {
    getRuntimeId: () => 'runtime-a',
    requireUsageRateLimits: () => rateLimits
  } as unknown as OrcaRuntimeService
  return { runtime }
}

function call(dispatcher: RpcDispatcher, method: string, params?: unknown) {
  const request: RpcRequest = { id: method, authToken: 'token', method, params }
  return dispatcher.dispatch(request)
}

describe('usage credential RPC methods', () => {
  beforeEach(() => {
    home.dir = mkdtempSync(join(tmpdir(), 'orca-usage-credentials-'))
    // Why plaintext: orcad's sealing is covered elsewhere; this pins where the bytes land.
    setSecretStore({
      isEncryptionAvailable: () => false,
      encryptString: () => {
        throw new Error('unused')
      },
      decryptString: () => {
        throw new Error('unused')
      },
      describeProtectionGap: () => null
    })
  })

  afterEach(() => {
    rmSync(home.dir, { recursive: true, force: true })
  })

  it('reports unsupported session-cookie status when no browser cookie jar exists', async () => {
    const { runtime } = createRuntime()
    const dispatcher = new RpcDispatcher({ runtime, methods: [...USAGE_CREDENTIAL_METHODS] })
    await expect(call(dispatcher, 'accounts.minimaxCredentialsStatus')).resolves.toMatchObject({
      ok: true,
      result: { sessionCookieSupported: false }
    })
    expect(existsSync(join(home.dir, '.orca'))).toBe(false)
  })

  // Why a tagged cipher: this process opens only what it sealed, as safeStorage and orcad do.
  function useSealingSecretStore(options: { working: boolean }): void {
    const tag = Buffer.from('this-host:')
    setSecretStore({
      isEncryptionAvailable: () => true,
      encryptString: (text) => {
        if (!options.working) {
          throw new Error('host key not loaded')
        }
        return Buffer.concat([tag, Buffer.from(text)])
      },
      decryptString: (cipher) => {
        if (!options.working || !cipher.subarray(0, tag.length).equals(tag)) {
          throw new Error('cannot open')
        }
        return cipher.subarray(tag.length).toString()
      },
      describeProtectionGap: () => null
    })
  }

  function writeKeyFile(fileName: string, contents: string): string {
    mkdirSync(join(home.dir, '.orca'), { recursive: true })
    const keyPath = join(home.dir, '.orca', fileName)
    writeFileSync(keyPath, contents)
    return keyPath
  }

  const sealedByOther = (prefix: string): string =>
    `${prefix}encrypted:${Buffer.from('other-app-cipher').toString('base64')}`

  const providers = [
    ['MiniMax', 'minimax-api-key.enc', 'orca-minimax-api-key:v1:', 'minimax'],
    ['GLM', 'zcode-plan-api-key.enc', API_KEY_ENVELOPE_PREFIX, 'zcodePlan']
  ] as const

  it.each(providers)(
    'reports a %s key sealed by another Orca app without changing it',
    async (_provider, fileName, prefix, methodPrefix) => {
      useSealingSecretStore({ working: true })
      const { runtime } = createRuntime()
      const dispatcher = new RpcDispatcher({ runtime, methods: [...USAGE_CREDENTIAL_METHODS] })
      const foreign = sealedByOther(prefix)
      const keyPath = writeKeyFile(fileName, foreign)

      await expect(
        call(dispatcher, `accounts.${methodPrefix}CredentialsStatus`)
      ).resolves.toMatchObject({
        ok: true,
        result: { apiKeyConfigured: true, apiKeyUnreadable: 'sealed-elsewhere' }
      })
      expect(readFileSync(keyPath, 'utf8')).toBe(foreign)
    }
  )

  it.each(providers)(
    'reports a corrupt %s key as unreadable without changing it',
    async (_provider, fileName, prefix, methodPrefix) => {
      useSealingSecretStore({ working: true })
      const { runtime } = createRuntime()
      const dispatcher = new RpcDispatcher({ runtime, methods: [...USAGE_CREDENTIAL_METHODS] })
      writeKeyFile(fileName, `${prefix}garbled-without-kind`)

      await expect(
        call(dispatcher, `accounts.${methodPrefix}CredentialsStatus`)
      ).resolves.toMatchObject({ ok: true, result: { apiKeyUnreadable: 'unreadable' } })
      expect(existsSync(join(home.dir, '.orca', fileName))).toBe(true)
    }
  )

  it.each(providers)(
    'does not blame the other app for a sealed %s key while this host cannot decrypt at all',
    async (_provider, fileName, prefix, methodPrefix) => {
      useSealingSecretStore({ working: false })
      const { runtime } = createRuntime()
      const dispatcher = new RpcDispatcher({ runtime, methods: [...USAGE_CREDENTIAL_METHODS] })
      const keyPath = writeKeyFile(fileName, sealedByOther(prefix))

      await expect(
        call(dispatcher, `accounts.${methodPrefix}CredentialsStatus`)
      ).resolves.toMatchObject({ ok: true, result: { apiKeyUnreadable: 'unreadable' } })
      expect(readFileSync(keyPath, 'utf8')).toBe(sealedByOther(prefix))
    }
  )

  it('refuses every call when usage credential services are not configured, storing nothing', async () => {
    const accounts = new RuntimeAccountController()
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: as above, backed by a real controller with no account services.
    const runtime = {
      getRuntimeId: () => 'runtime-a',
      requireUsageRateLimits: () => accounts.requireUsageRateLimits()
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: [...USAGE_CREDENTIAL_METHODS] })

    for (const method of [
      'accounts.minimaxCredentialsStatus',
      'accounts.zcodePlanCredentialsStatus'
    ]) {
      await expect(call(dispatcher, method)).resolves.toMatchObject({
        ok: false,
        error: { message: 'Account services are not configured on this runtime' }
      })
    }
    expect(existsSync(join(home.dir, '.orca'))).toBe(false)
  })
})
