import { homedir } from 'node:os'
import { readUserClaudeConfigDir, resolveClaudeDefaultHome } from './runtime-paths'
import { resolveLoginShellEnvironment } from '../startup/login-shell-environment'

/** Resolves Claude's CLI home from its explicit environment or the standard user home. */
export class ClaudeCliHomeResolver {
  private env: NodeJS.ProcessEnv
  private readonly userHome: string
  private readonly envReady: Promise<void>

  constructor(args: { userHome?: string; env?: NodeJS.ProcessEnv } = {}) {
    this.userHome = args.userHome ?? homedir()
    this.env = args.env ?? process.env
    this.envReady = args.env
      ? Promise.resolve()
      : resolveLoginShellEnvironment().then((env) => {
          this.env = env
        })
  }

  async prepareLaunch(): Promise<void> {
    await this.envReady
  }

  userConfigDir(): string | undefined {
    return readUserClaudeConfigDir(this.env)
  }

  systemDefaultHome(): string {
    return resolveClaudeDefaultHome(this.userHome, this.userConfigDir())
  }
}

let installed: ClaudeCliHomeResolver | undefined

export function installClaudeCliHomeResolver(resolver: ClaudeCliHomeResolver | undefined): void {
  installed = resolver
}

export function getClaudeCliHomeResolver(): ClaudeCliHomeResolver | undefined {
  return installed
}
