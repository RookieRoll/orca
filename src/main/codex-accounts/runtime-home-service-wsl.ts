import { join, posix as pathPosix, win32 as pathWin32 } from 'node:path'
import { parseWslUncPath, toLinuxPath, toWindowsWslUncPath } from '../../shared/wsl-paths'
import type { CodexAccountSelectionTarget } from './runtime-selection'
import { getDefaultWslDistro, getWslHome } from '../wsl'
import { CodexRuntimeHomeWslCore } from './runtime-home-service-wsl-core'

export abstract class CodexRuntimeHomeWsl extends CodexRuntimeHomeWslCore {
  protected getPreparedWslRateLimitHomePath(target: CodexAccountSelectionTarget): string | null {
    return this.getWslSystemCodexHomePath(target)
  }

  protected getWslCodexHomePathForSelection(target: CodexAccountSelectionTarget): string | null {
    return this.getWslSystemCodexHomePath(target)
  }

  protected joinWslPath(basePath: string, ...segments: string[]): string {
    return parseWslUncPath(basePath)
      ? pathWin32.join(basePath, ...segments)
      : join(basePath, ...segments)
  }

  protected resolveWslDefaultTarget(
    target: CodexAccountSelectionTarget
  ): CodexAccountSelectionTarget {
    if (target.runtime !== 'wsl' || target.wslDistro?.trim()) {
      return target
    }
    const defaultDistro = getDefaultWslDistro()
    return defaultDistro ? { runtime: 'wsl', wslDistro: defaultDistro } : target
  }

  protected getWslSystemCodexHomePath(target: CodexAccountSelectionTarget): string | null {
    if (process.platform !== 'win32') {
      return null
    }
    const distro = target.wslDistro?.trim() || getDefaultWslDistro()
    if (!distro) {
      return null
    }
    const home = getWslHome(distro)
    if (!home) {
      return null
    }
    if (/^[A-Za-z]:[\\/]/.test(home)) {
      const linuxHome = toLinuxPath(home).trim()
      return linuxHome.startsWith('/')
        ? toWindowsWslUncPath(pathPosix.join(linuxHome, '.codex'), distro)
        : null
    }
    return join(home, '.codex')
  }
}
