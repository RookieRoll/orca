import type { AgentProviderSessionMetadata } from '../../shared/agent-session-resume'
import type { CodexAccountSelectionTarget } from '../codex-accounts/runtime-selection'
import {
  trustedCodexResumeHomes,
  type CodexSessionResumePreparation
} from './codex-session-resume-home'
import { prepareCodexSessionResume } from './codex-session-resume-preparation'
import {
  prepareLegacySharedCodexSessionResume
} from './codex-legacy-session-resume'
import { codexHookService } from './hook-service'
import { reconcileCodexHooksForLaunch } from './codex-hook-reconcile'
import { ensureCodexDaemonSocketGuard } from './codex-config-mirror'
import { isAgentStatusHooksEnabledForAgent } from '../agent-hooks/managed-agent-hook-controls'
import { getSystemCodexHomePath } from './codex-home-paths'
import { normalizeRuntimePathForComparison } from '../../shared/cross-platform-path'
import type { CodexRuntimeHomeService } from '../codex-accounts/runtime-home-service'
import type { GlobalSettings } from '../../shared/global-settings-types'

/** Automatic Codex resume prep against a host's runtime-home service; the desktop and orcad share it. */
export function createCodexSessionResumeLaunchPreparation(deps: {
  getRuntimeHome: () => CodexRuntimeHomeService | null
  getSettings: () => GlobalSettings | undefined
}) {
  /** Hook repair and the daemon-socket guard for a pane that pins `home` as its CODEX_HOME rather
   *  than launching with the shell's inherited home, which spawn preparation handles. */
  async function prepareCodexPinnedLaunchHome(
    home: string,
    systemHomePath: string = getSystemCodexHomePath()
  ): Promise<void> {
    const isSystemHome =
      normalizeRuntimePathForComparison(home) === normalizeRuntimePathForComparison(systemHomePath)
    const isHooksEnabled = (): boolean =>
      isAgentStatusHooksEnabledForAgent(deps.getSettings(), 'codex')
    try {
      if (isSystemHome) {
        // Why bounded: the resume waits only briefly for a reconcile; it runs on ~/.codex whatever the selection.
        await reconcileCodexHooksForLaunch()
      } else if (isHooksEnabled()) {
        await codexHookService.installForLaunchPrep(home, true, isHooksEnabled)
      } else {
        await codexHookService.refreshRuntimeUserHooksForLaunchPrep(home)
      }
    } catch (error) {
      // Why: hook repair is best-effort; it must not stop the pane from launching in this home.
      console.warn('[codex-hook-service] failed to prepare automatic resume home:', error)
    }
    if (!isSystemHome) {
      // Why: this pins the pane's CODEX_HOME, and hook repair above can skip or fail before its config mirror applies the daemon guard.
      ensureCodexDaemonSocketGuard(home)
    }
  }

  async function prepareCodexSessionResumeForLaunch(args: {
    providerSession: AgentProviderSessionMetadata
    target: CodexAccountSelectionTarget
    launchEnv?: NodeJS.ProcessEnv
  }): Promise<CodexSessionResumePreparation | null> {
    const runtimeHome = deps.getRuntimeHome()
    if (args.target.runtime === 'wsl' || !runtimeHome || !deps.getSettings()) {
      return null
    }
    const systemHomePath = getSystemCodexHomePath()
    const trustedHomes = trustedCodexResumeHomes(runtimeHome, systemHomePath, args.launchEnv)
    // Why: resolved eagerly, once, before any ranking or provenance match. The
    // marker read used to be deferred into the ranking thunk so a
    // provenance-present resume never paid for it, but that optimisation let an
    // unreadable home reach the PTY as an empty candidate and another home's
    // readable alias wins. A throw here refuses the whole resume instead
    // (#STA-4422).
    // Why: a `fresh` outcome must skip migration and hook repair entirely — there is
    // no verified origin home to prepare, so the PTY layer drops the resume argv (#10793).
    const preparation = await prepareCodexSessionResume({
      sessionId: args.providerSession.id,
      transcriptPath: args.providerSession.transcriptPath,
      trustedCodexHomes: trustedHomes,
      systemCodexHomePath: systemHomePath,
      resolveVerifiedResumeHome: async (sessionSource) => {
        let migrated = { useRealCodexHome: false }
        try {
          migrated = await prepareLegacySharedCodexSessionResume(
            {
              agent: 'codex',
              executionHostId: 'local',
              filePath: sessionSource.transcriptPath,
              codexHome: sessionSource.homePath
            },
            {
              isHostSystemDefaultRealHomeSelected: () =>
                runtimeHome.isHostSystemDefaultRealHomeSelected(),
              systemCodexHomePath: systemHomePath
            }
          )
        } catch (error) {
          // Why: session migration is a compatibility repair; failure must not prevent resuming from the trusted origin home.
          console.warn(
            '[codex-session-resume] Legacy rollout migration failed; using origin home:',
            error
          )
        }
        const resumeHome = migrated.useRealCodexHome ? systemHomePath : sessionSource.homePath
        await prepareCodexPinnedLaunchHome(resumeHome, systemHomePath)
        return resumeHome
      }
    })
    return preparation
  }

  return { prepareCodexSessionResumeForLaunch, prepareCodexPinnedLaunchHome }
}
