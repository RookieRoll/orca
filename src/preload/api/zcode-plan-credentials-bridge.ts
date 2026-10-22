import { ipcRenderer } from 'electron'
import type { PreloadApi } from '../api-types'
import type { ZcodePlanCredentialsStatus } from '../../shared/zcode-plan-sites'

export const zcodePlanCredentialsApi = {
  getStatus: (): Promise<ZcodePlanCredentialsStatus> =>
    ipcRenderer.invoke('zcodePlanCredentials:getStatus')
} satisfies PreloadApi['zcodePlanCredentials']
