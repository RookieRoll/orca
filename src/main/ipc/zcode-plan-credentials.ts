import { ipcMain } from 'electron'
import {
  getZcodePlanCredentialsStatus
} from '../zcode/zcode-plan-credential-commands'

export function registerZcodePlanCredentialsHandlers(): void {
  ipcMain.handle('zcodePlanCredentials:getStatus', () => getZcodePlanCredentialsStatus())
}
