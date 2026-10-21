import { FLOATING_TERMINAL_WORKTREE_ID } from '../../../shared/constants'
import { BROWSER_SCREENCAST_RUNTIME_CAPABILITY } from '../../../shared/protocol-version'
import type { RuntimeStatus } from '../../../shared/runtime-types'
import type { AppState } from '@/store/types'
import { runtimeEnvironmentIdWithLegacyFallbackUnlessTwin } from './worktree-runtime-owner'
import { expectsBrowserClientHosting } from '../../../shared/browser-client-hosting-eligibility'
import {
  getOrcadSshDeployment,
  type PublicKnownRuntimeEnvironment
} from '../../../shared/runtime-environments'
import type { GlobalSettings } from '../../../shared/global-settings-types'

export const RUNTIME_BROWSER_UNAVAILABLE_MESSAGE =
  'Managed browser tabs are unavailable because the paired runtime does not support browser streaming.'

export type ClientCreationAction = 'managed-browser' | 'mobile-emulator'
export type ClientCreationActionProvider = 'local-client' | 'paired-runtime'

export type ClientCreationActionAvailability =
  | { state: 'enabled'; provider: ClientCreationActionProvider }
  | { state: 'hidden'; reason: string }

export type ClientCreationActionPolicy = Record<
  ClientCreationAction,
  ClientCreationActionAvailability
>

export function resolveClientCreationActionPolicy(args: {
  runtimeStatus: Pick<RuntimeStatus, 'capabilities' | 'hostPlatform'> | null
  floatingWorkspace?: boolean
  /** The runtime places its pages on this desktop (see runtimeHostsPagesOnThisDesktop). */
  runtimeHostsPagesOnThisDesktop?: boolean
}): ClientCreationActionPolicy {
  const browserStreamingAvailable = args.runtimeStatus?.capabilities?.includes(
    BROWSER_SCREENCAST_RUNTIME_CAPABILITY
  )

  return {
    'managed-browser': {
      state: 'enabled',
      provider:
        browserStreamingAvailable || args.runtimeHostsPagesOnThisDesktop
          ? 'paired-runtime'
          : 'local-client'
    },
    'mobile-emulator': { state: 'enabled', provider: 'local-client' }
  }
}

export function getClientCreationActionPolicy(
  state: AppState,
  worktreeId: string | null
): ClientCreationActionPolicy {
  const floatingWorkspace = worktreeId === FLOATING_TERMINAL_WORKTREE_ID
  const runtimeEnvironmentId = floatingWorkspace
    ? null
    : worktreeId
      ? runtimeEnvironmentIdWithLegacyFallbackUnlessTwin(state, worktreeId)
      : (state.settings?.activeRuntimeEnvironmentId?.trim() ?? null)
  const runtimeStatus = runtimeEnvironmentId
    ? (state.runtimeStatusByEnvironmentId?.get(runtimeEnvironmentId)?.status ?? null)
    : null

  return resolveClientCreationActionPolicy({
    runtimeStatus,
    floatingWorkspace,
    runtimeHostsPagesOnThisDesktop:
      runtimeEnvironmentId !== null && runtimeHostsPagesOnThisDesktop(state, runtimeEnvironmentId)
  })
}

/** The store fields that decide where a runtime's browser pages render. */
export type RuntimeBrowserHostingState = {
  runtimeStatusByEnvironmentId?: ReadonlyMap<
    string,
    { status: Pick<RuntimeStatus, 'capabilities' | 'deviceScope'> | null }
  >
  runtimeEnvironments?: readonly Pick<PublicKnownRuntimeEnvironment, 'id' | 'orcadDeployment'>[]
  settings?: Pick<GlobalSettings, 'browserClientHostedRemoteEnabled'> | null
}

/**
 * A runtime with no browser of its own (orcad) whose pages this desktop hosts, network tunnelled
 * through the runtime. A managed SSH deployment keeps desktop tabs on its SSH browser route.
 */
export function runtimeHostsPagesOnThisDesktop(
  state: RuntimeBrowserHostingState,
  runtimeEnvironmentId: string
): boolean {
  const environment = state.runtimeEnvironments?.find((entry) => entry.id === runtimeEnvironmentId)
  if (environment && getOrcadSshDeployment(environment)) {
    return false
  }
  const status = state.runtimeStatusByEnvironmentId?.get(runtimeEnvironmentId)?.status
  return expectsBrowserClientHosting({
    enabled: state.settings?.browserClientHostedRemoteEnabled !== false,
    preference: undefined,
    deviceScope: status?.deviceScope,
    capabilities: status?.capabilities
  })
}

export function assertClientCreationActionAvailable(
  state: AppState,
  worktreeId: string | null,
  action: ClientCreationAction
): void {
  const availability = getClientCreationActionPolicy(state, worktreeId)[action]
  if (availability.state !== 'enabled') {
    throw new Error(availability.reason)
  }
}

export function assertRuntimeManagedBrowserCreationAvailable(
  state: RuntimeBrowserHostingState,
  runtimeEnvironmentId: string
): void {
  const capabilities =
    state.runtimeStatusByEnvironmentId?.get(runtimeEnvironmentId)?.status?.capabilities
  if (
    !capabilities?.includes(BROWSER_SCREENCAST_RUNTIME_CAPABILITY) &&
    !runtimeHostsPagesOnThisDesktop(state, runtimeEnvironmentId)
  ) {
    throw new Error(RUNTIME_BROWSER_UNAVAILABLE_MESSAGE)
  }
}
