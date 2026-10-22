import { BROWSER_SIDECAR_OWNER_ENV } from '../shared/browser-sidecar-lifetime'
import { quitProcess } from './startup/process-quit-request'

export function installServeSupervisorDisconnectQuit(
  isServeMode: boolean,
  parent: {
    connected?: boolean
    once(event: 'disconnect', listener: () => void): unknown
    off(event: 'disconnect', listener: () => void): unknown
  } = process
): () => void {
  const isBrowserSidecar = process.env[BROWSER_SIDECAR_OWNER_ENV] === '1'
  delete process.env[BROWSER_SIDECAR_OWNER_ENV]
  if (!isServeMode || !isBrowserSidecar) {
    return () => undefined
  }
  const quit = (): void => quitProcess()
  parent.once('disconnect', quit)
  if (parent.connected !== true) {
    quit()
  }
  return () => parent.off('disconnect', quit)
}
