import type { CursorAccountStatus, GrokAccountStatus } from '../../shared/rate-limit-types'
import type { ZcodePlanCredentialsStatus } from '../../shared/zcode-plan-sites'
import type { MiniMaxCredentialsStatus } from '../../shared/minimax-credentials-status'

export type GrokAccountsApi = {
  getStatus: () => Promise<GrokAccountStatus>
}

export type CursorAccountsApi = {
  getStatus: () => Promise<CursorAccountStatus>
}

export type MinimaxCredentialsApi = {
  // Why: cookie + API key each live in their own safeStorage file, so the
  // status separates them. 'configured' stays as the OR so existing callers
  // that only care about "anything saved" keep working unchanged.
  getStatus: () => Promise<MiniMaxCredentialsStatus>
}

export type ZcodePlanCredentialsApi = {
  // Why: the GLM Coding Plan key lives in its own safeStorage file and the
  // ZCode CLI's config is read-only, so the status reports both sources'
  // presence; neither credential value ever crosses the IPC boundary.
  getStatus: () => Promise<ZcodePlanCredentialsStatus>
}
