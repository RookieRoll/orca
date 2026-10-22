import { ipcRenderer } from 'electron'
import type { PreloadApi } from '../api-types'
import type { MiniMaxCredentialsStatus } from '../../shared/minimax-credentials-status'

export const minimaxCredentialsApi = {
  getStatus: (): Promise<MiniMaxCredentialsStatus> =>
    ipcRenderer.invoke('minimaxCredentials:getStatus')
} satisfies PreloadApi['minimaxCredentials']
