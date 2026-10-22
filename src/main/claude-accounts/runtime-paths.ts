import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve, join } from 'node:path'
import {
  CLAUDE_INJECTED_CONFIG_DIR_ENV,
  CLAUDE_USER_CONFIG_DIR_ENV
} from '../../shared/claude-profile-routing'
import type { ClaudeEnvPatch } from './environment'

export type ClaudeRuntimePaths = {
  configDir: string
  configPath: string
  envPatch: ClaudeEnvPatch
}

export function readUserClaudeConfigDir(env: NodeJS.ProcessEnv): string | undefined {
  const user = readUserClaudeConfigDirAsSet(env)
  return user === undefined ? undefined : resolve(user.trim())
}

export function readUserClaudeConfigDirAsSet(env: NodeJS.ProcessEnv): string | undefined {
  const configDir = env.CLAUDE_CONFIG_DIR
  const injected = env[CLAUDE_INJECTED_CONFIG_DIR_ENV]?.trim()
  if (!configDir?.trim()) {
    return undefined
  }
  if (injected && resolve(injected) === resolve(configDir.trim())) {
    return env[CLAUDE_USER_CONFIG_DIR_ENV]?.trim() ? env[CLAUDE_USER_CONFIG_DIR_ENV] : undefined
  }
  return configDir
}

export function resolveClaudeDefaultHome(userHome: string, userConfigDir?: string): string {
  return userConfigDir ?? join(userHome, '.claude')
}

export class ClaudeRuntimePathResolver {
  getRuntimePaths(): ClaudeRuntimePaths {
    const inheritedConfigDir = process.env.CLAUDE_CONFIG_DIR?.trim() || null
    // Why: disabled Claude still reaches this resolver through background usage refreshes.
    const configDir = inheritedConfigDir || join(homedir(), '.claude')

    return {
      configDir,
      configPath: this.resolveConfigPath(configDir, inheritedConfigDir),
      envPatch: inheritedConfigDir ? { CLAUDE_CONFIG_DIR: configDir } : {}
    }
  }

  private resolveConfigPath(configDir: string, inheritedConfigDir: string | null): string {
    const colocatedConfigPath = join(configDir, '.claude.json')
    if (inheritedConfigDir || existsSync(colocatedConfigPath)) {
      return colocatedConfigPath
    }
    return join(homedir(), '.claude.json')
  }
}
