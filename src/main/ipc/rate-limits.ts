import { ipcMain } from 'electron'
import type { RateLimitService } from '../rate-limits/service'
import type { RateLimitRuntimeTarget } from '../../shared/rate-limit-types'
import type { CodexResetCreditCoordinator } from '../codex-accounts/codex-reset-credit-coordinator'

export function registerRateLimitHandlers(
  rateLimits: RateLimitService,
  codexResetCredits: CodexResetCreditCoordinator
): void {
  ipcMain.handle('rateLimits:get', () => rateLimits.getState())
  ipcMain.handle('rateLimits:refresh', () => rateLimits.refresh())
  ipcMain.handle('rateLimits:refreshCodexForTarget', (_event, target: RateLimitRuntimeTarget) =>
    rateLimits.refreshCodexForTarget(target)
  )
  // Why: default-home resets share the durable retry ledger across requests and restarts.
  ipcMain.handle('rateLimits:consumeCodexResetCredit', () =>
    codexResetCredits.consumeCurrent()
  )
  ipcMain.handle('rateLimits:refreshClaudeForTarget', (_event, target: RateLimitRuntimeTarget) =>
    rateLimits.refreshClaudeForTarget(target)
  )
  ipcMain.handle('rateLimits:setPollingInterval', (_event, ms: number) =>
    rateLimits.setPollingInterval(ms)
  )
  ipcMain.handle('rateLimits:refreshMiniMax', () => rateLimits.refresh())
  ipcMain.handle('rateLimits:refreshGrok', () => rateLimits.refreshGrok())
}
