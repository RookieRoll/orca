import { parseWslPath } from '../../../wsl'
import { githubReadExecutionScope } from '../../github-read-execution-scope'
import type { GitHubApiRepository } from '../../github-api-repository'
import type { GhExecOptions } from '../github-exec-scope'

function reusableHost(host: string): 'cloud' | 'enterprise' | null {
  if (!/^[a-z0-9][a-z0-9.-]*(?::\d+)?$/.test(host)) {
    return null
  }
  if (host === 'github.com' || host === 'github.localhost') {
    return 'cloud'
  }
  const name = host.split(':')[0]
  if (
    ['github.com', 'github.localhost', 'ghe.com'].some(
      (base) => name === base || name.endsWith(`.${base}`)
    )
  ) {
    return null
  }
  return 'enterprise'
}

export function snapshotCheckJobLogExecution(
  ownerRepo: GitHubApiRepository,
  options: GhExecOptions
): { ghOptions: GhExecOptions; executionScope: string | null } {
  const host = (ownerRepo.host ?? 'github.com').trim().toLowerCase()
  if (options.host !== undefined && options.host.trim().toLowerCase() !== host) {
    throw new Error('GitHub check details host is unavailable.')
  }
  const env: NodeJS.ProcessEnv = Object.freeze({
    ...(options.env ?? process.env),
    GH_PROMPT_DISABLED: (options.env ?? process.env).GH_PROMPT_DISABLED ?? '1'
  })
  const ghOptions = Object.freeze({ ...options, host, env })
  const native =
    process.platform !== 'win32' ||
    Boolean(options.cwd && !options.wslDistro && !parseWslPath(options.cwd))
  const family = reusableHost(host)
  const token =
    family === 'cloud'
      ? env.GH_TOKEN || env.GITHUB_TOKEN
      : env.GH_ENTERPRISE_TOKEN || env.GITHUB_ENTERPRISE_TOKEN
  if (!native || !family || !token) {
    return { ghOptions, executionScope: null }
  }
  const projection = {
    ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
    encoding: options.encoding ?? 'utf-8',
    ...(options.wslDistro === undefined ? {} : { wslDistro: options.wslDistro }),
    host
  }
  return { ghOptions, executionScope: githubReadExecutionScope(projection, env) }
}
