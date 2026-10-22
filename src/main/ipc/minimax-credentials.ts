import { ipcMain } from 'electron'
import {
  getMiniMaxCredentialsStatus
} from '../minimax/minimax-credential-commands'

export function registerMiniMaxCredentialsHandlers(): void {
  ipcMain.handle('minimaxCredentials:getStatus', () => getMiniMaxCredentialsStatus())
}
