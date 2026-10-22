import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  syncSystemConfigIntoManagedCodexHome
} from './codex-config-mirror'

let root: string
let runtimeHomePath: string
let systemHomePath: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'orca-mcp-ownership-'))
  runtimeHomePath = join(root, 'runtime')
  systemHomePath = join(root, 'system')
  mkdirSync(runtimeHomePath)
  mkdirSync(systemHomePath)
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

const BASELINE_FILE = '.orca-config-settings-baseline.json'

type StoredBaselineFixture = {
  version: 1 | 3
  settings: Record<string, string | null>
  mcpServers?: string[]
}

function writeBaseline(baseline: StoredBaselineFixture): string {
  const serialized = JSON.stringify(baseline)
  writeFileSync(join(runtimeHomePath, BASELINE_FILE), serialized)
  return serialized
}

describe('canonical MCP ownership during config mirroring', () => {
  it('does not duplicate a server defined inline in the canonical MCP table', () => {
    writeFileSync(
      join(runtimeHomePath, 'config.toml'),
      '[mcp_servers.shared]\ncommand = "runtime"\n'
    )
    writeFileSync(
      join(systemHomePath, 'config.toml'),
      '[mcp_servers]\nshared = { command = "system" }\n'
    )

    syncSystemConfigIntoManagedCodexHome({ runtimeHomePath, systemHomePath })

    const runtimeConfig = readFileSync(join(runtimeHomePath, 'config.toml'), 'utf-8')
    expect(runtimeConfig).toContain('shared = { command = "system" }')
    expect(runtimeConfig).not.toContain('[mcp_servers.shared]')
  })

  it('preserves deletion after a canonical inline server is rewritten by the runtime', () => {
    writeFileSync(
      join(runtimeHomePath, 'config.toml'),
      '[mcp_servers.shared]\ncommand = "runtime"\n'
    )
    writeFileSync(
      join(systemHomePath, 'config.toml'),
      '[mcp_servers]\nshared = { command = "system" }\n'
    )
    syncSystemConfigIntoManagedCodexHome({ runtimeHomePath, systemHomePath })
    writeFileSync(
      join(runtimeHomePath, 'config.toml'),
      '[mcp_servers.shared]\ncommand = "system"\n[mcp_servers.runtime_only]\ncommand = "runtime"\n'
    )
    writeFileSync(join(systemHomePath, 'config.toml'), 'model = "system"\n')

    syncSystemConfigIntoManagedCodexHome({ runtimeHomePath, systemHomePath })

    const runtimeConfig = readFileSync(join(runtimeHomePath, 'config.toml'), 'utf-8')
    expect(runtimeConfig).not.toContain('[mcp_servers.shared]')
    expect(runtimeConfig).toContain('[mcp_servers.runtime_only]')
  })

  it('honors a closed canonical MCP root and its later removal', () => {
    writeFileSync(
      join(runtimeHomePath, 'config.toml'),
      '[mcp_servers.runtime_only]\ncommand = "runtime"\n'
    )
    writeFileSync(
      join(systemHomePath, 'config.toml'),
      'mcp_servers = { shared = { enabled = false } }\n'
    )
    syncSystemConfigIntoManagedCodexHome({ runtimeHomePath, systemHomePath })
    expect(readFileSync(join(runtimeHomePath, 'config.toml'), 'utf-8')).not.toContain(
      '[mcp_servers.'
    )
    expect(
      JSON.parse(
        readFileSync(join(runtimeHomePath, '.orca-config-settings-baseline.json'), 'utf-8')
      )
    ).toMatchObject({ mcpServerRoot: true })
    writeFileSync(join(runtimeHomePath, 'config.toml'), '[mcp_servers.shared]\nenabled = false\n')
    writeFileSync(join(systemHomePath, 'config.toml'), 'model = "system"\n')

    syncSystemConfigIntoManagedCodexHome({ runtimeHomePath, systemHomePath })

    expect(readFileSync(join(runtimeHomePath, 'config.toml'), 'utf-8')).not.toContain(
      '[mcp_servers.'
    )
  })
})

describe('MCP ownership migration', () => {
  it('keeps a pre-ownership baseline canonical for one pass', () => {
    writeFileSync(join(runtimeHomePath, 'config.toml'), '[mcp_servers.removed]\ncommand = "old"\n')
    writeFileSync(join(systemHomePath, 'config.toml'), 'model = "system"\n')
    writeFileSync(
      join(runtimeHomePath, '.orca-config-settings-baseline.json'),
      JSON.stringify({ version: 1, settings: {} })
    )

    syncSystemConfigIntoManagedCodexHome({ runtimeHomePath, systemHomePath })

    expect(readFileSync(join(runtimeHomePath, 'config.toml'), 'utf-8')).not.toContain(
      '[mcp_servers.'
    )
    expect(
      JSON.parse(
        readFileSync(join(runtimeHomePath, '.orca-config-settings-baseline.json'), 'utf-8')
      )
    ).toMatchObject({ mcpServers: [] })
    writeFileSync(join(runtimeHomePath, 'config.toml'), '[mcp_servers.added]\ncommand = "new"\n')

    syncSystemConfigIntoManagedCodexHome({ runtimeHomePath, systemHomePath })

    expect(readFileSync(join(runtimeHomePath, 'config.toml'), 'utf-8')).toContain(
      '[mcp_servers.added]'
    )
  })

  it('tracks commented CRLF names so their later removal remains authoritative', () => {
    writeFileSync(
      join(runtimeHomePath, 'config.toml'),
      '[mcp_servers.shared]\ncommand = "runtime"\n'
    )
    writeFileSync(
      join(systemHomePath, 'config.toml'),
      '[mcp_servers.shared] # see [docs]\r\ncommand = "system"\r\n'
    )

    syncSystemConfigIntoManagedCodexHome({ runtimeHomePath, systemHomePath })
    expect(readFileSync(join(runtimeHomePath, 'config.toml'), 'utf-8')).not.toContain('"runtime"')
    writeFileSync(join(systemHomePath, 'config.toml'), 'model = "system"\n')

    syncSystemConfigIntoManagedCodexHome({ runtimeHomePath, systemHomePath })

    expect(readFileSync(join(runtimeHomePath, 'config.toml'), 'utf-8')).not.toContain(
      '[mcp_servers.shared]'
    )
  })
})
