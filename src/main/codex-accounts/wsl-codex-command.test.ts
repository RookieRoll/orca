import { describe, expect, it } from 'vitest'
import {
  buildWslCodexAppServerArgs,
  buildWslCodexIdentityProbe
} from './wsl-codex-command'
import { CODEX_READ_ONLY_APP_SERVER_ARGS } from '../codex-cli/codex-read-only-app-server-args'

describe('WSL Codex commands', () => {
  it('quotes an explicit read-only app-server contract without changing the default', () => {
    const readOnlyCommand = buildWslCodexAppServerArgs(
      'Ubuntu',
      '/home/alice/managed-home',
      CODEX_READ_ONLY_APP_SERVER_ARGS
    ).at(-1)
    const defaultCommand = buildWslCodexAppServerArgs('Ubuntu', '/home/alice/managed-home').at(-1)

    for (const arg of CODEX_READ_ONLY_APP_SERVER_ARGS) {
      expect(readOnlyCommand).toContain(arg)
    }
    expect(defaultCommand).toContain('app-server')
    expect(defaultCommand).not.toContain('approval_policy=never')
  })

  it('reports the login-shell binary path and version for identity checks', () => {
    const command = buildWslCodexIdentityProbe('Ubuntu').args.at(-1)

    expect(command).toMatch(/printf .*"\$resolved"/)
    expect(command).toContain('exec "$resolved" --version')
  })
})
