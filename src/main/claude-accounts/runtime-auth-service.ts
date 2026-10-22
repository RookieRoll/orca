import { join, posix } from 'node:path'
import { toWindowsWslPath } from '../../shared/wsl-paths'
import { resolveLocalAccountRuntimeTarget } from '../../shared/local-account-runtime'
import type { Store } from '../persistence'
import { isWslDistroRunning } from '../wsl-background-distro-gate'
import { getDefaultWslDistro, getWslHome } from '../wsl'
import {
  ClaudeCliHomeResolver,
  installClaudeCliHomeResolver
} from './claude-cli-home-resolver'
import type { ClaudeAccountSelectionTarget } from './runtime-selection'
import type { ClaudeRuntimeAuthPreparation } from './runtime-auth/runtime-auth-types'

export type { ClaudeRuntimeAuthPreparation } from './runtime-auth/runtime-auth-types'

/** Resolves Claude's CLI home without copying authentication or routing through managed profiles. */
export class ClaudeRuntimeAuthService {
  readonly cliHomeResolver: ClaudeCliHomeResolver

  constructor(
    private readonly store: Pick<Store, 'getSettings'>,
    private readonly isDistroRunning: (distro: string) => Promise<boolean> = isWslDistroRunning
  ) {
    this.cliHomeResolver = new ClaudeCliHomeResolver()
    installClaudeCliHomeResolver(this.cliHomeResolver)
  }

  async prepareForClaudeLaunch(
    target?: ClaudeAccountSelectionTarget
  ): Promise<ClaudeRuntimeAuthPreparation> {
    await this.cliHomeResolver.prepareLaunch()
    return this.preparation(target)
  }

  async prepareForRateLimitFetch(
    target?: ClaudeAccountSelectionTarget
  ): Promise<ClaudeRuntimeAuthPreparation> {
    const resolved = this.resolveTarget(target)
    if (resolved.runtime === 'wsl' && resolved.wslDistro) {
      if (!(await this.isDistroRunning(resolved.wslDistro))) {
        return {
          configDir: '',
          envPatch: {},
          provenance: 'wsl:unavailable',
          usageError: `WSL distro ${resolved.wslDistro} is not running.`
        }
      }
    } else {
      await this.cliHomeResolver.prepareLaunch()
    }
    return this.preparation(target)
  }

  getRuntimeConfigDir(target?: ClaudeAccountSelectionTarget): string {
    const resolved = this.resolveTarget(target)
    if (resolved.runtime === 'wsl' && resolved.wslDistro) {
      return join(getWslHome(resolved.wslDistro), '.claude')
    }
    return this.cliHomeResolver.systemDefaultHome()
  }

  private preparation(target?: ClaudeAccountSelectionTarget): ClaudeRuntimeAuthPreparation {
    const resolved = this.resolveTarget(target)
    if (resolved.runtime === 'wsl' && resolved.wslDistro) {
      const linuxConfigDir = posix.join(getWslHome(resolved.wslDistro), '.claude')
      return {
        configDir: toWindowsWslPath(linuxConfigDir, resolved.wslDistro),
        runtime: 'wsl',
        wslDistro: resolved.wslDistro,
        wslLinuxConfigDir: linuxConfigDir,
        envPatch: {},
        provenance: `wsl:${resolved.wslDistro}`
      }
    }
    const configDir = this.cliHomeResolver.systemDefaultHome()
    return {
      configDir,
      runtime: 'host',
      wslDistro: null,
      wslLinuxConfigDir: null,
      envPatch: {},
      provenance: 'system'
    }
  }

  private resolveTarget(target?: ClaudeAccountSelectionTarget): ClaudeAccountSelectionTarget {
    const effective =
      target ??
      (process.platform === 'win32'
        ? resolveLocalAccountRuntimeTarget(this.store.getSettings())
        : { runtime: 'host' as const })
    if (effective.runtime !== 'wsl' || effective.wslDistro?.trim()) {
      return effective
    }
    const defaultDistro = getDefaultWslDistro()
    return defaultDistro ? { runtime: 'wsl', wslDistro: defaultDistro } : effective
  }
}
