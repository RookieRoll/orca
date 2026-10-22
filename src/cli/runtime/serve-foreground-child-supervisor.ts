import type { ChildProcessHandle } from '@orca/process-host/process-spec'
import {
  QUIT_RENDERER_ACK_TIMEOUT_MS,
  WILL_QUIT_TEARDOWN_DEADLINE_MS
} from '../../shared/quit-teardown-deadline'
import { serveSignalExitError } from './serve-signal-exit-diagnostic'

export const SERVE_CHILD_FORCE_KILL_SCHEDULING_MARGIN_MS = 5_000
export const SERVE_CHILD_FORCE_KILL_GRACE_MS =
  QUIT_RENDERER_ACK_TIMEOUT_MS +
  WILL_QUIT_TEARDOWN_DEADLINE_MS +
  SERVE_CHILD_FORCE_KILL_SCHEDULING_MARGIN_MS

export function superviseForegroundServe(child: ChildProcessHandle): Promise<number> {
  return new Promise((resolve, reject) => {
    const forwardsHangup = process.platform === 'linux'
    const forwardedSignals = new Set<NodeJS.Signals>()
    let forceKillTimer: ReturnType<typeof setTimeout> | null = null
    let settled = false
    const forwardSignal = (signal: NodeJS.Signals): void => {
      if (process.platform !== 'win32') {
        forwardedSignals.add(signal)
        child.kill(signal)
      }
      forceKillTimer ??= setTimeout(() => child.kill('SIGKILL'), SERVE_CHILD_FORCE_KILL_GRACE_MS)
    }
    const cleanup = (): void => {
      process.off('SIGINT', forwardSignal)
      process.off('SIGTERM', forwardSignal)
      if (forwardsHangup) {
        process.off('SIGHUP', forwardSignal)
      }
      if (forceKillTimer) {
        clearTimeout(forceKillTimer)
      }
    }
    process.on('SIGINT', forwardSignal)
    process.on('SIGTERM', forwardSignal)
    if (forwardsHangup) {
      process.on('SIGHUP', forwardSignal)
    }
    const handleExit = (code: number | null, signal: NodeJS.Signals | null): void => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      if (signal && !forwardedSignals.has(signal)) {
        reject(serveSignalExitError(signal))
        return
      }
      resolve(code ?? 0)
    }
    child.once('error', (error) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      if (typeof child.off === 'function') {
        child.off('exit', handleExit)
      }
      reject(error)
    })
    child.once('exit', handleExit)
  })
}
