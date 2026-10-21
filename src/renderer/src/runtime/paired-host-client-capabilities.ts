import { ELECTRON_REMOTE_RUNTIME_CLIENT_CAPABILITIES } from '../../../shared/electron-remote-runtime-client-capabilities'
import { remoteRuntimeClientCapabilities } from '../../../shared/remote-runtime-client-capabilities'

/** What this Electron client tells a paired host it can do. */
export function pairedHostClientCapabilities(): readonly string[] {
  return remoteRuntimeClientCapabilities(ELECTRON_REMOTE_RUNTIME_CLIENT_CAPABILITIES)
}
