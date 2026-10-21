export type DesktopWindowChromeInput = {
  platform: NodeJS.Platform
}

export function isLocalWindowsDesktopClient(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Windows')
}

export function shouldRenderDesktopWindowChrome({ platform }: DesktopWindowChromeInput): boolean {
  return platform === 'win32' || platform === 'linux'
}
