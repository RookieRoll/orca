import { getRuntimePathBasename } from '../../../../../shared/cross-platform-path'

export type LocalHtmlBrowserFile = {
  fileName: string
  filePath: string
}

export function browserFileUrlToAbsolutePath(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'file:') {
      return null
    }
    const hostPrefix =
      parsed.hostname && parsed.hostname !== 'localhost' ? `//${parsed.hostname}` : ''
    const absolutePath = `${hostPrefix}${decodeURIComponent(parsed.pathname)}`
    const path = /^\/[A-Za-z]:\//.test(absolutePath) ? absolutePath.slice(1) : absolutePath
    return /^[A-Za-z]:[\\/]/.test(path) || /^[\\/]{2}/.test(path)
      ? path.replaceAll('/', '\\')
      : path
  } catch {
    return null
  }
}

export function getLocalHtmlFileFromBrowserUrl(url: string): LocalHtmlBrowserFile | null {
  const filePath = browserFileUrlToAbsolutePath(url)
  if (!filePath || !/\.html?$/i.test(filePath)) {
    return null
  }
  const fileName = getRuntimePathBasename(filePath)
  return fileName ? { fileName, filePath } : null
}
